import { FieldConfig, ProcessType } from '../types/fieldConfig';

const getApiBase = () => {
    const envBase = (import.meta as ImportMeta & { env?: { VITE_API_BASE?: string } }).env?.VITE_API_BASE;
    if (envBase) {
        return `${envBase}/config/fields`;
    }
    return '/api/config/fields';
};

export const fieldConfigService = {
    async getAllConfigs(): Promise<FieldConfig[]> {
        const response = await fetch(getApiBase());
        if (!response.ok) throw new Error('Failed to fetch configs');
        return response.json();
    },

    async getConfigsByProcessType(processType: ProcessType): Promise<FieldConfig[]> {
        const response = await fetch(`${getApiBase()}/type/${processType}`);
        if (!response.ok) throw new Error('Failed to fetch configs');
        return response.json();
    },

    async createConfig(config: Partial<FieldConfig>): Promise<FieldConfig> {
        const response = await fetch(getApiBase(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(config),
        });
        if (!response.ok) throw new Error('Failed to create config');
        const result = await response.json();
        return result.config;
    },

    async updateConfig(id: string, updates: Partial<FieldConfig>): Promise<void> {
        const response = await fetch(`${getApiBase()}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        });
        if (!response.ok) throw new Error('Failed to update config');
    },

    async deleteConfig(id: string): Promise<void> {
        const response = await fetch(`${getApiBase()}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete config');
    },

    async syncDefaults(): Promise<void> {
        const response = await fetch('/api/config/sync', {
            method: 'POST',
        });
        if (!response.ok) throw new Error('Failed to sync defaults');
    }
};
