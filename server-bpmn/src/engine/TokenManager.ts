import type { Token, TokenStatus } from '../types';

export class TokenManager {
  private tokens: Map<string, Token> = new Map();

  createToken(instanceId: string, currentNodeId: string): Token {
    const token: Token = {
      id: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      instanceId,
      currentNodeId,
      status: 'ACTIVE',
      createdAt: new Date()
    };
    this.tokens.set(token.id, token);
    return token;
  }

  getToken(id: string): Token | undefined {
    return this.tokens.get(id);
  }

  getTokensByInstance(instanceId: string): Token[] {
    return Array.from(this.tokens.values()).filter(t => t.instanceId === instanceId);
  }

  getActiveTokensByInstance(instanceId: string): Token[] {
    return this.getTokensByInstance(instanceId).filter(t => t.status === 'ACTIVE');
  }

  updateTokenStatus(id: string, status: TokenStatus): Token | undefined {
    const token = this.tokens.get(id);
    if (token) {
      token.status = status;
      this.tokens.set(id, token);
      return token;
    }
    return undefined;
  }

  moveToken(id: string, newNodeId: string): Token | undefined {
    const token = this.tokens.get(id);
    if (token) {
      token.currentNodeId = newNodeId;
      this.tokens.set(id, token);
      return token;
    }
    return undefined;
  }

  consumeToken(id: string): boolean {
    const token = this.tokens.get(id);
    if (token && token.status === 'ACTIVE') {
      token.status = 'CONSUMED';
      this.tokens.set(id, token);
      return true;
    }
    return false;
  }

  deleteTokensByInstance(instanceId: string): void {
    const tokens = this.getTokensByInstance(instanceId);
    tokens.forEach(token => {
      this.tokens.delete(token.id);
    });
  }
}
