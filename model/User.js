//User model
const mongoose = require('mongoose')
const uniqueValidator = require('mongoose-unique-validator')

const userSchema = mongoose.Schema({
    username : {
        type: String,
        unique: true,
        required: true,
        minlength: 5
    },
    name: String,
    passwordHash: String,
    expense : [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Expense'
        }
    ]    
})

userSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
        delete returnedObject.passwordHash
    }
})

userSchema.plugin(uniqueValidator)
const User = mongoose.model('User', userSchema)

module.exports = User