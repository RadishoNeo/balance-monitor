import { StandardBalance, VendorConfig } from '../../types/balance';
import { BalanceParserFactory } from './parsers';

export class BalanceMonitorService {
    private parserFactory = new BalanceParserFactory();
    private monitoringTasks = new Map<string, NodeJS.Timeout>();

    async checkBalance(config: VendorConfig): Promise<StandardBalance> {
        try {
            // 1. 发送请求
            const response = await this.makeRequest(config);

            // 2. 使用策略模式解析响应
            const parser = this.parserFactory.getParser(config.name);
            const balance = parser.parse(response);

            // 3. 应用阈值检查 (可以在此处根据 config.thresholds 调整 balance.status)
            if (config.thresholds) {
                if (balance.available_balance <= config.thresholds.danger) {
                    balance.status = 'danger';
                } else if (balance.available_balance <= config.thresholds.warning) {
                    balance.status = 'warning';
                }
            }

            return balance;
        } catch (error: any) {
            console.error(`Error checking balance for ${config.name}:`, error);
            return {
                currency: 'UNKNOWN',
                available_balance: 0,
                status: 'inactive',
                last_updated: new Date().toISOString(),
                meta: { error: error.message }
            };
        }
    }

    private async makeRequest(config: VendorConfig): Promise<any> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        // 设置认证头
        switch (config.auth.type) {
            case 'Bearer':
                headers[config.auth.headerKey || 'Authorization'] = `Bearer ${config.auth.apiKey}`;
                break;
            case 'Basic':
                headers[config.auth.headerKey || 'Authorization'] = `Basic ${config.auth.apiKey}`;
                break;
            case 'APIKey':
                headers[config.auth.headerKey || 'X-API-Key'] = config.auth.apiKey;
                break;
        }

        const options: RequestInit = {
            method: config.method,
            headers
        };

        if (config.body && config.method === 'POST') {
            options.body = typeof config.body === 'string'
                ? config.body
                : JSON.stringify(config.body);
        }

        // 注意：在浏览器环境中，fetch 可能会遇到跨域问题。
        // 如果是 Electron 应用，建议在主进程中发送请求，或者通过代理。
        // 这里保持 PARSE.md 的 fetch 实现。
        const response = await fetch(config.url, options);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
    }

    startMonitoring(config: VendorConfig, callback: (balance: StandardBalance) => void) {
        // 停止已有的同名任务
        this.stopMonitoring(config.name);

        const interval = config.monitoring?.interval || 30;

        // 立即执行一次
        this.checkBalance(config).then(callback);

        // 设置定时任务
        const taskId = setInterval(async () => {
            const balance = await this.checkBalance(config);
            callback(balance);
        }, interval * 60 * 1000);

        this.monitoringTasks.set(config.name, taskId);
    }

    stopMonitoring(vendorName: string) {
        const taskId = this.monitoringTasks.get(vendorName);
        if (taskId) {
            clearInterval(taskId);
            this.monitoringTasks.delete(vendorName);
        }
    }

    stopAll() {
        for (const taskId of this.monitoringTasks.values()) {
            clearInterval(taskId);
        }
        this.monitoringTasks.clear();
    }
}

// 导出单例
export const balanceMonitorService = new BalanceMonitorService();
