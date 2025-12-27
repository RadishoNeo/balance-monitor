import { net } from 'electron'
import { Logger } from './logger'

export interface APIRequest {
  url: string
  method: 'GET' | 'POST'
  headers: Array<{ key: string; value: string }>
  auth?: any
  body?: string
  timeout?: number
}

export interface APIResponse {
  success: boolean
  data?: any
  error?: string
  statusCode?: number
  responseTime: number
}

export class APIEngine {
  private logger: Logger

  constructor() {
    this.logger = new Logger('APIEngine')
  }

  async executeRequest(request: APIRequest): Promise<APIResponse> {
    const startTime = Date.now()

    return new Promise((resolve) => {
      // 验证URL
      try {
        new URL(request.url)
      } catch (error: any) {
        console.log(error)

        resolve({
          success: false,
          error: `无效的URL: ${request.url}`,
          responseTime: Date.now() - startTime
        })
        return
      }

      // 构建请求选项
      const requestOptions: any = {
        url: request.url,
        method: request.method,
        headers: this.buildHeaders(request.headers, request.auth)
      }

      if (request.body && request.method === 'POST') {
        requestOptions.body = request.body
      }

      // 创建请求
      const req = net.request(requestOptions)

      // 设置超时
      const timeout = request.timeout || 10000
      const timeoutId = setTimeout(() => {
        req.abort()
        resolve({
          success: false,
          error: '请求超时',
          responseTime: Date.now() - startTime
        })
      }, timeout)

      req.on('response', (response) => {
        clearTimeout(timeoutId)

        let data = ''
        response.on('data', (chunk) => {
          data += chunk.toString()
        })

        response.on('end', () => {
          const responseTime = Date.now() - startTime

          if (response.statusCode >= 200 && response.statusCode < 300) {
            try {
              const jsonData = JSON.parse(data)
              resolve({
                success: true,
                data: jsonData,
                statusCode: response.statusCode,
                responseTime
              })
            } catch (error) {
              resolve({
                success: false,
                error: `JSON解析失败: ${error}`,
                statusCode: response.statusCode,
                responseTime
              })
            }
          } else {
            resolve({
              success: false,
              error: `HTTP ${response.statusCode}: ${data}`,
              statusCode: response.statusCode,
              responseTime
            })
          }
        })
      })

      req.on('error', (error) => {
        clearTimeout(timeoutId)
        resolve({
          success: false,
          error: `网络错误: ${error.message}`,
          responseTime: Date.now() - startTime
        })
      })

      req.on('abort', () => {
        clearTimeout(timeoutId)
        resolve({
          success: false,
          error: '请求被中止',
          responseTime: Date.now() - startTime
        })
      })

      req.end()
    })
  }

  private buildHeaders(headers: any[], auth?: any): Record<string, string> {
    const result: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'BalanceMonitor/1.0'
    }

    // 1. 处理常规 Headers
    if (Array.isArray(headers)) {
      headers.forEach((header) => {
        if (header.key && header.value) {
          result[header.key] = header.value
        }
      })
    }

    // 2. 处理 Auth 配置 (DeepSeek, Moonshot 等模板使用)
    if (auth && auth.apiKey) {
      const headerKey = auth.headerKey || 'Authorization'
      if (auth.type === 'Bearer') {
        result[headerKey] = `Bearer ${auth.apiKey}`
      } else if (auth.type === 'Basic') {
        // 如果已经是 base64 或者是 raw username:password
        if (!auth.apiKey.includes(':') && /^[A-Za-z0-9+/=]+$/.test(auth.apiKey)) {
          result[headerKey] = `Basic ${auth.apiKey}`
        } else {
          const encoded = Buffer.from(auth.apiKey).toString('base64')
          result[headerKey] = `Basic ${encoded}`
        }
      } else {
        // Custom 或其他情况直接设置
        result[headerKey] = auth.apiKey
      }
    }

    return result
  }

  async testConnection(request: APIRequest): Promise<APIResponse> {
    this.logger.info(`测试连接: ${request.method} ${request.url}`)
    return this.executeRequest(request)
  }
}
