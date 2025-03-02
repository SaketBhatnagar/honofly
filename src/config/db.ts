import { User } from "../modules/users/user.dto";


interface UserDb {  
    data : User[];
}

export const UserDb : UserDb = {
    data : [
        {
            id: "1",
            name: "John Doe",
            email: "john@doe.com",
            password: "password",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: "2",
            name: "Jane Doe",
            email: "jane@doe.com",
            password: "password",
            createdAt: new Date(),
            updatedAt: new Date()
        },
        {
            id: "3",
            name: "Jim Doe",
            email: "jim@doe.com",
            password: "password",
            createdAt: new Date(),
            updatedAt: new Date()
        }
    ],
}