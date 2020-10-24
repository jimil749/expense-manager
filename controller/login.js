//login controller
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const loginRouter = require('express').Router()
const User = require('../model/User')

loginRouter.post('/', async(request, response) => {
    const body = request.body
    const user = await User.findOne({username: body.username})

    const passwordCorrect = user === null ? false : await bcrypt.compare(body.password, user.passwordHash)

    
    if (! (passwordCorrect && user)) {
        return response.status(401).json({
            error: 'invalid Credentials'
        })
    } 
    //generate token for the browser if the credentials check out
    const userToken = {
        username: user.username,
        id: user._id
    }

    const token = jwt.sign(userToken, process.env.SECRET)

    response
        .status(200)
        .send({ token, username: user.username, name: user.name })
})

module.exports = loginRouter
