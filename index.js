require('dotenv').config()
const express = require('express')
const { response } = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')
const app = express()

app.use(cors())
app.use(express.static('build'))
app.use(express.json())

morgan.token('req-body', (req, _res) => 
    JSON.stringify(req.body)
)

// Log with tiny configuration by default
app.use(morgan('tiny', {
    skip: function (req, res) { return req.method === "POST" }
}))

// Log also request body for POST requests
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :req-body', {
    skip: function (req, res) { return req.method !== "POST" }
}))

app.get('/', (req, res) => {
    res.send('<h1>Puhelinluettelo backend</h1>')
})

app.get('/api/persons', (request, response) => {
    Person.find({}).then(persons => {
        response.json(persons)
    })
})

app.get('/api/persons/:id', (req, res, next) => {
    Person.findById(req.params.id).then(person => {
        if (person) {
            res.json(person)
        } else {
            res.status(404).end()
        }
    })
    .catch(error => next(error))

    console.log(req.method, typeof(req.method))
})

app.get('/info', (request, response) => {
    Person.estimatedDocumentCount({}, (error, count) => {
        response.send(`
        <p>Phonebook has info for ${count} people</p>
        <p>${new Date()}</p>
        `)
    })
})

app.post('/api/persons', (req, res) => {
    const body = req.body

    if (!body.name) {
        return res.status(400).json({
            error: 'Name missing'
        })
    }

    if (!body.number) {
        return res.status(400).json({
            error: 'Number missing'
        })
    }

/*     if (persons.map(p => p.name).includes(body.name)) {
        return res.status(400).json({
            error: 'Name must be unique!'
        })
    }  */

    const person = new Person({
        name: body.name,
        number: body.number
    })

    person.save().then(savedPerson => {
        res.json(savedPerson)
    })
})

app.delete('/api/persons/:id', (req, res, next) => {
    Person.findByIdAndRemove(req.params.id).then(result => {
        res.status(204).end()
    })
    .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}

app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
    console.error(error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformed id' })
    }

    next(error)
}

app.use(errorHandler)

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})