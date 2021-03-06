require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')
const app = express()

app.use(cors())
app.use(express.static('build'))
app.use(express.json())

morgan.token('req-body', (req) =>
  JSON.stringify(req.body)
)

// Log with tiny configuration by default
app.use(morgan('tiny', {
  skip: function (req) { return req.method === 'POST' }
}))

// Log also request body for POST requests
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :req-body', {
  skip: function (req) { return req.method !== 'POST' }
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

app.post('/api/persons', (req, res, next) => {
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

  const person = new Person({
    name: body.name,
    number: body.number
  })

  person.save().then(savedPerson => {
    res.json(savedPerson)
  })
    .catch(error => next(error))
})

app.put('/api/persons/:id', (req, res, next) => {
  const newPerson = {
    name: req.body.name,
    number: req.body.number
  }

  Person.findByIdAndUpdate(req.params.id, newPerson, { new: true })
    .then(updatedPerson => {
      res.json(updatedPerson)
    })
    .catch(error => next(error))
})

app.delete('/api/persons/:id', (req, res, next) => {
  Person.findByIdAndRemove(req.params.id).then(() => {
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
  } else if (error.name === 'ValidationError') {
    return response.status(400).send({ error: error.message })
  }

  next(error)
}

app.use(errorHandler)

// eslint-disable-next-line no-undef
const PORT = process.env.PORT
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})