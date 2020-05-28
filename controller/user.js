const userRouter = require('express').Router()
const bcrypt = require('bcrypt')
const User = require('../model/User')

userRouter.get('/', async(request, response) => {
    const user = await User.find({}).populate('expense', { title: 1, amount: 1, category: 1, date: 1, notes: 1, })
    response.json(users.map(user => user.toJSON()))
})

userRouter.post('/', async(request, response) => {
    //creating the users
    const body = request.body
    if (body.password.length < 3) {
        return response.status(400).json({
            'error': 'Min password length is 3'
        })
    }
    //generating password hash
    const saltRounds = 10
    const passwordHash = await bcrypt.hash(body.password, saltRounds)

    //create a new user
    const user = new User({
        username: body.username,
        name: body.name,
        passwordHash
    })

    const savedUser = await user.save()
    user.expense = user.expense.concat(savedUser._id)
    response.json(savedUser.toJSON())
})