import 'dotenv/config'
import mongoose from 'mongoose'
import fs from 'node:fs/promises'
try {
 await mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:15000})
 const db=mongoose.connection.db
 const categories=await db.collection('categories').find({}).toArray()
 const products=await db.collection('products').find({},{projection:{name:1,slug:1,price:1,categoryId:1,description:1,variants:1,careInstructions:1}}).toArray()
 await fs.mkdir('output/color-drafts',{recursive:true})
 await fs.writeFile('output/color-drafts/catalog-reference.json',JSON.stringify({categories,products},null,2))
 console.log(JSON.stringify({categories:categories.map(c=>({id:c._id,name:c.name,slug:c.slug})),products:products.map(p=>({name:p.name,price:p.price,categoryId:p.categoryId}))},null,2))
} finally {await mongoose.disconnect()}
