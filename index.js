require('dotenv').config()
const express = require('express')
const { response } = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')
const app = express()

app.use(express.json())
app.use(cors())
app.use(express.static('build'))

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

app.get('/api/persons/:id', (req, res) => {
    Person.findById(req.params.id).then(person => {
        res.json(person)
    })
    console.log(req.method, typeof(req.method))
})

app.get('/info', (request, response) => {
    Person.find({}).then(persons => {
        response.send(`
        <p>Phonebook has info for ${persons.length} people</p>
        <p>${new Date()}</p>
        `)
    })
})

/* const generateId = () => {
    return Math.floor(Math.random() * 99999)
} */

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

app.delete('/api/persons/:id', (req, res) => {
    const id = Number(req.params.id)
    persons = persons.filter(person => person.id !== id)

    res.status(204).end()
})

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})