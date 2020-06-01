/* 
    Backend : 
    1) User login and sign-up : done
    2) Add Expense : done
    3) View User's expense : done
    4) Testing : done
    Frontend : 
    2) Add
    3) Expense Overview

*/
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

expenseRouter.get('/preview', async(request, response) => {
    const token = getToken(request)
    if (token == null) {
        return response.status(401).json({ error: 'token missing or invalid' })
    }

    const decodedToken = jwt.verify(token, process.env.SECRET)
    
    if (!token || !decodedToken) {
        return response.status(401).json({ error: 'token missing or invalid' })
    }  

    const date = new Date()
    const y = date.getFullYear()
    const m = date.getMonth()
    const firstDay = new Date(y, m, 1)
    const lastDay = new Date(y, m+1, 0)

    const today = new Date()
    today.setUTCHours(0,0,0,0)

    const tomorrow = new Date()
    tomorrow.setUTCHours(0,0,0,0)
    tomorrow.setDate(tomorrow.getDate()+1)

    const yesterday = new Date()
    yesterday.setUTCHours(0,0,0,0)
    yesterday.setDate(yesterday.getDate-1)

    const expense = await Expense.aggregate([
        {
            $facet: {
                month: [
                    {$match : { date: {$gte: firstDay, $lte: lastDay}}},
                    {$group : { _id: "currentMonth", totalSpent: {$sum: "$amount"}}},
                ],
                today: [
                    {$match : { date: {$gte: today, $lte: tomorrow}}},
                    {$group : { _id: "today", totalSpent: {$sum: "$amount"}}},                
                ],
                yesterday: [
                    {$match : { date: {$gte: yesterday, $lte: today}}},
                    {$group : { _id: "yesterday", totalSpent: {$sum: "$amount"}}},                
                ]
            }
    }])
    let expensePreview = {month: expense[0].month[0], today: expense[0].today[0], yesterday: expense[0].yesterday[0]}
    response.json(expensePreview)
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