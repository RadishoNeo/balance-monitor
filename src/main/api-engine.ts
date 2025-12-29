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

  private buildHeaders(
    headers: Array<{ key: string; value: string }> = [],
    auth?: {
      type?: 'Bearer' | 'Basic' | string
      apiKey?: string
      headerKey?: string
    }
  ): Record<string, string> {
    const result: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'BalanceMonitor/1.0'
    }

    // 普通 headers
    for (const { key, value } of headers) {
      if (key && value) {
        result[key] = value
      }
    }

    if (!auth?.apiKey) return result

    const headerKey = auth.headerKey ?? 'Authorization'
    const apiKey = auth.apiKey

    switch (auth.type) {
      case 'Bearer':
        result[headerKey] = `Bearer ${apiKey}`
        break

      case 'Basic': {
        const isBase64 = !apiKey.includes(':') && /^[A-Za-z0-9+/=]+$/.test(apiKey)

        const encoded = isBase64 ? apiKey : Buffer.from(apiKey).toString('base64')

        result[headerKey] = `Basic ${encoded}`
        break
      }

      default:
        result[headerKey] = apiKey
    }

    return result
  }

  async testConnection(request: APIRequest): Promise<APIResponse> {
    this.logger.info(`测试连接: ${request.method} ${request.url}`)
    return this.executeRequest(request)
  }
}
