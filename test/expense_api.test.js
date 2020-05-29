const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const api = supertest(app)
const Expense = require('../model/Expense')
const User = require('../model/User')
const bcrypt = require('bcrypt')

let token

const initialExpense = [
    {
        title: "Birthday Party",
        amount: 1200,
        category: "Leisure",
        date: new Date(),
        notes: "Party Blast!"
    }
]

const initialUsername = [
    {
        username: "blaze",
        name: "Brad Pitt",
        password: "IAmAwesome"
    }
]

beforeEach(async () => {    
    await User.deleteMany({})
    const saltRound = 10
    const passwordHash = await bcrypt.hash(initialUsername[0].password, saltRound)
    const newUser = new User({
        username: initialUsername[0].username,
        name: initialUsername[0].name,
        passwordHash
    })
    const user = await newUser.save()
    await Expense.deleteMany({})
    const newExpense = new Expense({
        title: initialExpense[0].title,
        amount: initialExpense[0].amount,
        category: initialExpense[0].category,
        date: initialExpense[0].date,
        notes: initialExpense[0].notes,
        user: user._id
    })
    const expense = await newExpense.save()
    return expense
})

const expenseInDB = async() => {
    const expense = await Expense.find({})
    return expense.map(expenses => expenses.toJSON())
}

//tests
test('expenses are returned as json', async () => {
    const response = await api
        .post('/api/login/')
        .send({
            username: "blaze",
            password: "IAmAwesome"
        })
    token = response.body.token

    await api
        .get('/api/expenses/')
        .set('Authorization', `bearer ${token}`)
        .expect(200)
        .expect('Content-Type', /application\/json/)

}, 30000)

test('all expenses are returned for an user', async () => {
    const response = await api
    .post('/api/login/')
    .send({
        username: "blaze",
        password: "IAmAwesome"
    })
    token = response.body.token
    const apiResponse = await api   
        .get('/api/expenses/')
        .set('Authorization', `bearer ${token}`)
    expect(apiResponse.body.length).toBe(initialExpense.length)
}, 30000)

test('a valid expense can be added only when with a valid token', async () => {
    const response = await api
    .post('/api/login/')
    .send({
        username: "blaze",
        password: "IAmAwesome"
    })
    token = response.body.token
    const newExpense = {
        title: "Grocery Shopping",
        amount: "250",
        category: "Necessity",
        date: new Date(),
        notes: "Daily Ration",        
    }    
    await api
        .post('/api/expenses/')
        .set('Authorization', `bearer ${token}`)
        .send(newExpense)
        .expect(200)
        .expect('Content-Type', /application\/json/)

    const expenseAtEnd = await expenseInDB()
    expect(expenseAtEnd.length).toBe(initialExpense.length+1)

    const title = expenseAtEnd.map(t => t.title)
    expect(title).toContain(
        "Grocery Shopping"
    )
})

test('expense cannot be added without valid token', async () => {
    const newExpense = {
        title: "Grocery Shopping",
        amount: "250",
        category: "Necessity",
        date: new Date(),
        notes: "Daily Ration",        
    }
    await api
        .post('/api/expenses')
        .send(newExpense)
        .expect(401)
    const expenseAtEnd = await expenseInDB()
    expect(expenseAtEnd.length).toBe(initialExpense.length)   
})


