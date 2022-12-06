import express from 'express'
import fetch from 'node-fetch'
const app = express()
const PORT = 4000

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

//functions
const getItems = async data => {
  const response = await fetch(
    `https://api.mercadolibre.com/sites/MLA/search?q=${data}`
  ).then(res => res.json())
  return response
}

const formatItems = (data, body) => {
  let categories = data.available_filters
    .find(filter => filter.id === 'category')
    .values.sort((a, b) => b.results - a.results)
    .map(item => item.name)

  const items = data.results.map(item => ({
    id: item.id,
    title: item.title,
    price: {
      currency: item.currency_id,
      amount: Math.round(item.price),
      decimals: (item.price % 1).toFixed(2)
    },
    picture: item.thumbnail,
    condition: item.condition,
    free_shipping: item.shipping.free_shipping
  }))

  const formattedData = {
    author: {
      name: body.name,
      lastname: body.lastname
    },
    categories,
    items
  }
  return formattedData
}

const getItemByID = async (id, body) => {
  const item = await fetch(`https://api.mercadolibre.com/items/${id}`).then(
    res => res.json()
  )
  const itemDescri = await fetch(
    `https://api.mercadolibre.com/items/${id}/description`
  ).then(res => res.json())

  const response = Promise.all([item, itemDescri]).then(values => ({
    author: {
      name: body.name,
      lastname: body.lastname
    },
    item: {
      id: values[0].id,
      title: values[0].title,
      price: {
        currency: values[0].currency_id,
        amount: Math.round(values[0].price),
        decimals: (values[0].price % 1).toFixed(2)
      },
      picture: values[0].thumbnail,
      condition: values[0].condition,
      free_shipping: values[0].shipping.free_shipping,
      sold_quantity: values[0].sold_quantity,
      description: values[1].plain_text
    }
  }))

  return response
}

//routes
app.get('/', (req, res) => {
  res.send({
    msg: 'API running!!!'
  })
})

app.post('/api/items', async (req, res) => {
  const data = await getItems(req.query.q)
  const finalData = formatItems(data, req.body)
  res.send(finalData)
})

app.post('/api/items/:id', async (req, res) => {
  const data = await getItemByID(req.params.id, req.body)
  res.send(data)
})
//routes

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
