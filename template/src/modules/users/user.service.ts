import { UserDb } from '../../config/db.js';
import { CreateUserDto, UpdateUserDto, User } from './user.dto.js';

export class UserService {
    private db: typeof UserDb;

    constructor() {
        this.db = UserDb;
    }

    async createUser(userData: CreateUserDto): Promise<User> {
        const user: User = {
            id  : (this.db.data.length + 1).toString(),
            ...userData,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        this.db.data.push(user);
        return user;
    }

    async getUser(id: string): Promise<User | null> {
        const user = this.db.data.find(u => +u.id === +id);
        return user || null;
    }

    async updateUser(id: string, userData: UpdateUserDto): Promise<User | null> {
        const index = this.db.data.findIndex(u => +u.id === +id);
        if (index === -1) return null;

        const updatedUser: User = {
            ...this.db.data[index],
            ...userData,
            updatedAt: new Date()
        };

        this.db.data[index] = updatedUser;
        return updatedUser;
    }

    async deleteUser(id: string): Promise<boolean> {
        const index = this.db.data.findIndex(u => +u.id === +id);
        if (index === -1) return false;

        this.db.data.splice(index, 1);
        return true;
    }

    async listUsers(): Promise<User[]> {
        return this.db.data;
    }
}

