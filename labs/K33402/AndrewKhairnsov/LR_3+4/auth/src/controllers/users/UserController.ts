import User from '../../models/users/User'
import UserService from '../../services/users/UserService'
import UserError from '../../errors/users/UserError'
import jwt from 'jsonwebtoken'
import {jwtOptions} from '../../middlewares/passport'
import RefreshTokenService from '../../services/auth/RefreshToken'

class UserController {
    private userService: UserService;

    constructor() {
        this.userService = new UserService();
    }

    get = async (request: any, response: any) => {
        try {
            response.send(await this.userService.getById(
                Number(request.params.id)
            ));
        } catch (error: any) {
            response.status(404).send({"error": error.message});
        }
    };

    post = async (request: any, response: any) => {
        const {body} = request;

        try {
            response.status(201).send(await this.userService.create(body));
        } catch (error: any) {
            response.status(400).send({"error": error.message});
        }
    };

    me = async (request: any, response: any) => {
        response.send(request.user);
    };

    auth = async (request: any, response: any) => {
        const {body} = request;
        const {email, password} = body;

        try {
            const {user, checkPassword} = await this.userService.checkPassword(email, password)

            if (checkPassword) {
                const payload = {id: user.id};
                console.log('payload is', payload);
                const accessToken = jwt.sign(payload, jwtOptions.secretOrKey);
                const refreshTokenService = new RefreshTokenService(user);
                const refreshToken = await refreshTokenService.generateRefreshToken();
                response.send({accessToken, refreshToken});
            } else {
                throw new Error('Login or password is incorrect!');
            }
        } catch (e: any) {
            response.status(401).send({"error": e.message});
        }
    };

    refreshToken = async (request: any, response: any) => {
        const {body} = request;
        const {refreshToken} = body;
        const refreshTokenService = new RefreshTokenService();

        try {
            const {userId, isExpired} = await refreshTokenService
                .isRefreshTokenExpired(refreshToken);

            if (!isExpired && userId) {
                const user = await this.userService.getById(userId);
                const payload = {id: user.id};
                const accessToken = jwt.sign(payload, jwtOptions.secretOrKey);
                const refreshTokenService = new RefreshTokenService(user);
                const refreshToken = await refreshTokenService.generateRefreshToken();
                response.send({accessToken, refreshToken});
            } else {
                throw new Error('Invalid credentials');
            }
        } catch (e) {
            response.status(401).send({'error': 'Invalid credentials'});
        }
    };

    getAllUsers = async (request: any, response: any) => {
        try {
            response.send(await this.userService.getAllUsers());
        } catch (error: any) {
            response.status(404).send({"error": error.message});
        }
    };


    validateToken = async (request: any, response: any) => {
        const {accessToken} = request.body;
        try {
            // @ts-ignore
            response.send({'valid': true, 'user': await this.userService.getById(jwt.verify(accessToken, jwtOptions.secretOrKey).id)})
        } catch (error: any) {
            response.status(401).send({'valid': false})
        }
    }
}

export default UserController
