const logger = require('./logger')

const requestLogger = (request, response, next) => {
    logger.info('Method : ', request.method)
    logger.info('Path : ', request.path)
    logger.info('Body : ', request.body)
    next()
}

const unknownEndPoint = (response, request) => {
    return response.status(404).send({ error: 'Unknown End Point'})    
}

const errorHandler = (err, response, request, next) => {
    logger.error(err.message)

    if (err.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if (err.name === 'ValidationError') {
        return response.status(400).send({ error: err.message })
    } 
    next(err)
}


module.exports = {
    requestLogger,
    unknownEndPoint,
    errorHandler,    
}