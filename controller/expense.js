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
    //get all userExpenses
    const token = getToken(request)
    if (token == null) {
        return response.status(401).json({ error: 'token missing or invalid' })
    }

    const decodedToken = jwt.verify(token, process.env.SECRET)

    if (!token || !decodedToken) {
        return response.status(401).json({ error: 'token missing or invalid' })
    }    
    const user = await User.findById(decodedToken.id)
    const expenses = await Expense.find({user: user._id}) 
    response.json(expenses.map(expense => expense.toJSON()))  
})

expenseRouter.post('/', async(request, response) => {    
    //add an expense
    try {
        const body = request.body
        const token = getToken(request)

        if (token == null) {
            return response.status(401).json({ error: 'token missing or invalid' })
        }

        //decode the token into username and id
        const decodedToken = jwt.verify(token, process.env.SECRET)

        if (!token || !decodedToken) {
            return response.status(401).json({ error: 'token missing or invalid' })
        }
        // find user by the id
        const user = await User.findById(decodedToken.id)

        const expense = new Expense({
            title: body.title,
            amount: body.amount,
            category: body.category,
            date: body.date,
            notes: body.notes,
            user: user._id
        })

        const saveExpense = await expense.save()
        user.expense = user.expense.concat(saveExpense._id)
        await user.save()
        response.json(saveExpense.toJSON())
    } catch(exception) {
        console.log(exception)
    }
})

module.exports = expenseRouter