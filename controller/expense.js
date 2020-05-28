const expenseRouter = require('express').Router()
const Expense = require('../model/Expense')
const User = require('../model/User')
const jwt = require('jsonwebtoken')

const getToken = request => {
    const authorization = request.get('authorization')  //authorization header contains web token
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        return authorization.substring(7)
    }
    return null
}


expenseRouter.get('/', async (request, response) => {
    const expenses = await Expense.find({})
    response.json(expenses.map(expense => expense.toJSON()))
}),

expenseRouter.post('/', async(request, response) => {    
    const body = request.body
    const token = getToken(request)

    if (token == null) {
        response.status(401).json({ error: 'token missing or invalid' })
    }

    //decode the token into username and id
    const decodedToken = jwt.verify(token, process.env.SECRET)

    if (!token || !decodedToken) {
        response.status(401).json({ error: 'token missing or invalid' })
    }
    // find user by the id
    const user = await User.findById(decodedToken.id)

    const expense = new Expense({
        title: body.title,
        amount: body.amount,
        category: body.category,
        date: body.date,
        notes: body.notes
    })

    const saveExpense = await expense.save()
    user.expense = user.expense.concat(saveExpense._id)
    await user.save()
    response.json(saveExpense.toJSON())
})

module.exports = expenseRouter