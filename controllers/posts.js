const express = require('express');
const router = express.Router();
const Post = require('../models/post');
const passport = require('passport');
const users = require('./users');

const jwt = require('jsonwebtoken');
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

/**
 * @swagger
 * /v1/api/posts:
 *  get:
 *      description: Returns all blog posts
 *      responses:
 *          200:
 *              description: OK 
 *          400:
 *              description: Bad Request
 */
/* GET: /api/posts => show all posts */
router.get('/', async (req, res, next) => {
    try {
        // use model to get all docs newest to oldest
        let posts = await Post.find().sort({ 'date': -1 });

        return res.json(posts).status(200); // 200: OK
    }
    catch (err) {
        return res.json(err).status(400); // 400: Bad Request
    }        
});

/**
 * @swagger
 * /v1/api/posts:
 *  post:
 *      description: Create new blog post
 *      consumes:
 *          - application/json:
 *      parameters:
 *          - in: body
 *            name: post
 *            schema:
 *              type: object
 *              required:
 *                  - title
 *                  - body
 *                  - username
 *              properties:
 *                  title:
 *                    type: string
 *                  body:
 *                      type: string
 *                  username:
 *                      type: string
 *      responses:
 *          201:
 *              description: Created
 *          400:
 *              description: Bad Request
 *          401:
 *              description: Unauthorized
 */
/* POST: /api/posts => create new post from http request body */
router.post('/', async (req, res, next) => {

    try {
    //console.log(req);
        const token = req.cookies.authToken;
        if (token) {
            //console.log(token);
            const decode = jwt.verify(token, process.env.PASSPORT_SECRET);
            const post = await Post.create(req.body);
            return res.json(post).status(201); // 201: Resource Created
        }
        else {
            console.log('no token');
            return res.status(401).json({msg: 'Unauthorized'});
        }
    }
    catch (err) {
        return res.json(err).status(400); // 400: Bad Request
    }

/*
    try {
        const post = await Post.create(req.body);
        return res.json(post).status(201); // 201: Resource Created
    }
    catch(err) {
        return res.json(err).status(400); // 400: Bad Request
    }
    */
});

/* DELETE: /api/posts/abc123 => delete selected post */
router.delete('/:_id', async (req, res, next) => {
    try {
        const token = req.cookies.authToken;
        if (token) {
            //console.log(token);
            const decode = jwt.verify(token, process.env.PASSPORT_SECRET);
            console.log(decode);
        // console.log('delete start');
        // const username = users.verifyToken(req);
        // console.log('un: ' + username);
        // if (username == 'undefined') {
        //     return res.status(401).json({msg: 'Unauthorized'});
        //}
        //else {
            let post = await Post.findById(req.params._id);

            console.log(post);
            if (post == null) {
                console.log('404');
                return res.status(404).json({msg: 'Post Not Found'});
            }
            else {
                //console.log(`req.user: ${req.user}`);
                if (post.username !== decode.username) {
                    console.log('403');
                    return res.status(403).json({msg: 'Unauthorized'});
                }
                else {
                    await Post.findByIdAndDelete(req.params._id);
                    console.log('204');
                    return res.status(204).json({}); // 204: No Content
                }
            }
        }
        else {
            console.log('no token');
            return res.status(401).json({msg: 'Unauthorized'});
        }
    }
    catch(err) {
        return res.json(err).status(404); // 404: Not Found
    }
});

/* PUT: /api/posts/abc123 => update selected post */
router.put('/:_id', async (req, res, next) => {
    try {
        //console.log(req);
            const token = req.cookies.authToken;
            if (token) {
                //console.log(token);
                const decode = jwt.verify(token, process.env.PASSPORT_SECRET);

                //let post = await Post.findByIdAndUpdate(req.params._id, req.body);
                let post = await Post.findById(req.params._id);

                if (!post) {
                    return res.status(404).json({msg: 'Post Not Found'});
                }

                if (post.username != decode.username) {
                    return res.status(403).json({msg: 'Unauthorized'});
                }

                await Post.findByIdAndUpdate(req.params._id, req.body);
                return res.status(202).json(post); // 202: Resource Modified
            }
            else {
                return res.status(401).json({msg: 'Unauthorized'}); // 401: Unauthorized
            }
    }
    catch(err) {
        return res.status(404).json(err); // 404: Not Found
    }
});

module.exports = router;