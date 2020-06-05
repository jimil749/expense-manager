const expenseRouter = require('express').Router()
const Expense = require('../model/Expense')
const User = require('../model/User')
const jwt = require('jsonwebtoken')
const mongoose = require('mongoose')

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
    let firstDay = request.query.firstDay
    let lastDay = request.query.lastDay
    try{
        const expenses = await Expense.find({'$and': [{'date': {'$gte': firstDay, '$lte': lastDay}}, {'user': user._id}]}).sort('date') 
        response.json(expenses.map(expense => expense.toJSON()))
    } catch(exception) {
        console.log(exception)
        response.json({
            err: 'err fetching'
        })
    }
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

    const user = await User.findById(decodedToken.id)
    console.log(user._id)
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
    yesterday.setDate(yesterday.getDate()-1)
    try {
        const expense = await Expense.aggregate([
            {
                $facet: {
                    month: [
                        {$match : { date: {$gte: firstDay, $lte: lastDay}, user: mongoose.Types.ObjectId(user._id)}},
                        {$group : { _id: "currentMonth", totalSpent: {$sum: "$amount"}}},
                    ],
                    today: [
                        {$match : { date: {$gte: today, $lte: tomorrow}, user: mongoose.Types.ObjectId(user._id)}},
                        {$group : { _id: "today", totalSpent: {$sum: "$amount"}}},                
                    ],
                    yesterday: [
                        {$match : { date: {$gte: yesterday, $lte: today}, user: mongoose.Types.ObjectId(user._id)}},
                        {$group : { _id: "yesterday", totalSpent: {$sum: "$amount"}}},                
                    ]
                }
        }])
        let expensePreview = {month: expense[0].month[0], today: expense[0].today[0], yesterday: expense[0].yesterday[0]}
        response.json(expensePreview)
    } catch(exception) {
        console.log(exception)
        response.json({
            err: 'error occured'
        })
    }

})

expenseRouter.get('/category/preview', async (request, response) => {

    const token = getToken(request)
    if (token == null) {
        return response.status(401).json({ error: 'token missing or invalid' })
    }

    const decodedToken = jwt.verify(token, process.env.SECRET)
    
    if (!token || !decodedToken) {
        return response.status(401).json({ error: 'token missing or invalid' })
    }

    const user = await User.findById(decodedToken.id)
    
    const date = new Date()
    const y = date.getFullYear()
    const m = date.getMonth()
    const firstDay = new Date(y,m,1)
    const lastDay = new Date(y,m+1,0)

    try {
        let categoryMonthlyAverage = await Expense.aggregate([
            {
                $facet: {
                    average: [
                        {$match : { user: mongoose.Types.ObjectId(user._id)}},
                        {$group : {_id: {category: "$category", month: {$month: "$date"}},totalSpent: {$sum: "$amount"} }},
                        {$group : {_id: "$_id.category", avgSpent: {$avg: "$totalSpent"}}},
                        {
                            $project: {
                                _id: "$_id", value: {average: "$avgSpent"}
                            }
                        }
                    ],
                    total: [
                        {$match : {date: {$gte: firstDay, $lte: lastDay}, user: mongoose.Types.ObjectId(user._id)}},
                        {$group : {_id: "$category", totalSpent: {$sum: "$amount"}}},
                        {
                            $project: {
                                _id: "$_id", value: {total: "$totalSpent"}
                            }
                        }
                    ]
                }
            },
            {
                $project: {
                    overview: {$setUnion: ['$average', '$total']},
                }
            },
            {$unwind: '$overview'},
            {$replaceRoot: {newRoot: "$overview"}},
            {$group: {_id: "$_id", mergedValues: {$mergeObjects: "$value"}}}
        ]).exec()
        response.json(categoryMonthlyAverage)
    } catch(exception) {
        console.log(expection)        
    }

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
        response.json({
            'error': 'Cannot add data'
        })
    }
})

expenseRouter.put('/:id', async(request, response) => {
    const token = getToken(request)
    if (token == null) {
        return response.status(401).json({ error: 'token missing or invalid' })
    }

    const decodedToken = jwt.verify(token, process.env.SECRET)
    
    if (!token || !decodedToken) {
        return response.status(401).json({ error: 'token missing or invalid' })
    }

    const body = request.body
    const expenses = {
        title: body.title,
        amount: body.amount,
        category: body.category,
        date: body.date,
        notes: body.notes
    }

    const user = await User.findById(decodedToken.id)
    const expense = await Expense.findById(request.params.id)
    if (user._id.toString() === expense.user.toString()) {
        try {
            const updatedExpense = await Expense.findByIdAndUpdate(request.params.id, expenses, { new: true })
            response.json(updatedExpense.toJSON())            
        } catch(err) {
            console.log(err)
            return  response.status(400).json({
                error: 'Tokens do not match'
            })
        }
    }
})

expenseRouter.delete('/:id', async(request, response) => {
    const token = getToken(request)
    if (token == null) {
        return response.status(401).json({ error: 'token missing or invalid' })
    }

    const decodedToken = jwt.verify(token, process.env.SECRET)
    
    if (!token || !decodedToken) {
        return response.status(401).json({ error: 'token missing or invalid' })
    }

    const user = await User.findById(decodedToken.id)
    const expense = await Expense.findById(request.params.id)
    
    try {
        if (user._id.toString() === expense.user.toString()) {
            await Expense.findByIdAndDelete(request.params.id)
            return response.status(204).end()
        } else {
            return response.status(400).json({
                error: 'Tokens do not match'
            })
        }
    } catch(err) {
        console.log(err)
        return response.status(400).json({
            error: err
        })
    }
    
})

module.exports = expenseRouter