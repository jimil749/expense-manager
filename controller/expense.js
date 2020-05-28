const expenseRouter = require('express').Router()
const Expense = require('../model/Expense')


expenseRouter.get('/', async (request, response) => {
    const expenses = await Expense.find({})
    response.json(expenses.map(expense => expense.toJSON()))
}),

expenseRouter.post('/', async(request, response) => {    
    const body = request.body
    
    const expense = new Expense({
        title: body.title,
        amount: body.amount,
        category: body.category,
        date: body.date,
        notes: body.notes
    })

    const saveExpense = await expense.save()
    response.json(saveExpense.toJSON())
})

module.exports = expenseRouter