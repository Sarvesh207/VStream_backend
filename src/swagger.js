import swaggerAutogen from "swagger-autogen";

const swagger = swaggerAutogen();

const doc = {
    info: {
        title: "VStream API",
        description: "Video playing app backend API documentation",
        version: "1.0.0",
    },
    host: `localhost:${process.env.PORT || 8000}`,
    schemes: ["http", "https"],
    securityDefinitions: {
        bearerAuth: {
            type: "apiKey",
            name: "Authorization",
            in: "header",
            description:
                'JWT Authorization header using the Bearer scheme. Example: "Bearer {token}"',
        },
    },
    definitions: {
        User: {
            username: "johndoe",
            email: "john@example.com",
            fullName: "John Doe",
            avatar: "https://example.com/avatar.jpg",
            coverImage: "https://example.com/cover.jpg",
            watchHistory: [],
            createdAt: "2023-01-01T00:00:00.000Z",
        },
        RegisterUser: {
            username: "johndoe",
            email: "john@example.com",
            password: "password123",
            fullName: "John Doe",
            avatar: "file",
            coverImage: "file",
        },
        LoginUser: {
            email: "john@example.com",
            password: "password123",
        },
        Video: {
            title: "My Video",
            description: "Video description",
            thumbnail: "https://example.com/thumbnail.jpg",
            videoFile: "https://example.com/video.mp4",
            duration: 120,
            views: 0,
            isPublished: true,
            owner: "60f1b2b3b4b5b6b7b8b9b0b1",
        },
        Comment: {
            content: "This is a comment",
            video: "60f1b2b3b4b5b6b7b8b9b0b1",
            owner: "60f1b2b3b4b5b6b7b8b9b0b1",
        },
        ApiResponse: {
            statusCode: 200,
            data: {},
            message: "Success",
            success: true,
        },
    },
};

const outputFile = "./swagger-output.json";
const routes = [
    "./src/routes/user.routes.js",
    "./src/routes/video.routes.js",
    "./src/routes/subscription.routes.js",
    "./src/routes/like.routes.js",
    "./src/routes/playlist.routes.js",
    "./src/routes/comment.routes.js",
    "./src/routes/tweet.routes.js",
    "./src/routes/healthcheck.routes.js",
    "./src/routes/dashboard.routes.js",
];

swagger(outputFile, routes, doc);
