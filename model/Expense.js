//Expense Model
const mongoose = require('mongoose')

const expenseSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,        
    },
    date: {
        type: Date,
        required: true,
    },
    notes: String,
    user : {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
})

expenseSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__V
    }
})

module.exports = mongoose.model('Expense', expenseSchema)