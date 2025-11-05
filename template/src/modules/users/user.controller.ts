import { HttpContext } from '../../types/http.types.js';
import { UserService } from './user.service.js';
import { CreateUserDto, UpdateUserDto } from './user.dto.js';

export class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    async createUser({res,req}:HttpContext) {
        try {
            const body = await req.body();
            const user = await this.userService.createUser(body as unknown as CreateUserDto);
            return res.json(user, 201);
        } catch (error) {
            return res.json({ error: 'Invalid req body' }, 400);
        }
    }

    async getUser({res,req}:HttpContext) {
        const id = req.params['id'];
        const user = await this.userService.getUser(id);
        
        if (!user) {
            return res.json({ error: 'User not found' }, 404);
        }
        
        return res.json(user);
    }

    async updateUser({res,req}:HttpContext) {
        try {
            const id = req.params['id'];
            const body = await req.body() as UpdateUserDto;
            
            const user = await this.userService.updateUser(id, body);
            if (!user) {
                return res.json({ error: 'User not found' }, 404);
            }
            
            return res.json(user);
        } catch (error) {
            return res.json({ error: 'Invalid req body' }, 400);
        }
    }

    async deleteUser({req, res}: HttpContext) {
        const id = req.params['id'];
        const deleted = await this.userService.deleteUser(id);
        
        if (!deleted) {
            return res.json({ error: 'User not found' }, 404);
        }
        
        return res.json({ message: 'User deleted successfully' });
    }

    async listUsers({res,req}:HttpContext) {
        const users = await this.userService.listUsers();
        return res.json(users);
    }
}

