export class CommandAPI {
    static baseUrl = 'http://your-server:port/api/commands';

    static async getAllCommands(code) {
        const response = await fetch(`${this.baseUrl}?code=${code}`);
        return response.json();
    }

    static async updateCommand(id, data, code) {
        return fetch(`${this.baseUrl}/${id}?code=${code}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    }

    // Аналогичные методы для create и delete
}