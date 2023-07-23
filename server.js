const express = require('express')
const expressGraphQL = require('express-graphql').graphqlHTTP
const _ = require('lodash')
//Importing graphQl properties
const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLList,
    GraphQLInt,
    GraphQLNonNull,
} = require('graphql')

const app = express()
//Creating graphql DB
// const schema = new GraphQLSchema({
//     query: new GraphQLObjectType({
//         //cant contain space(razmak)
//         name: 'PrviUpit',
//         fields: ()=>({
//             message:{
//                 type: GraphQLString,
//                 //Resolve tells graphql where to get info from.
//                 resolve: ()=> 'Pozz Graphql'
//             },
//             city:{
//                 type: GraphQLString,
//                 //Resolve tells graphql where to get info from and return it.
//                 //resolve(parent,arg)
//                 resolve: ()=> 'Novi Pazar'
//             }
//         })
//     })
// })
//Manual schema data
const authors = [
	{ id: 1, name: 'J. K. Rowling' },
	{ id: 2, name: 'J. R. R. Tolkien' },
	{ id: 3, name: 'Brent Weeks' }
]
const books = [
	{ id: 1, name: 'Harry Potter and the Chamber of Secrets', authorId: 1 },
	{ id: 2, name: 'Harry Potter and the Prisoner of Azkaban', authorId: 1 },
	{ id: 3, name: 'Harry Potter and the Goblet of Fire', authorId: 1 },
	{ id: 4, name: 'The Fellowship of the Ring', authorId: 2 },
	{ id: 5, name: 'The Two Towers', authorId: 2 },
	{ id: 6, name: 'The Return of the King', authorId: 2 },
	{ id: 7, name: 'The Way of Shadows', authorId: 3 },
	{ id: 8, name: 'Beyond the Shadows', authorId: 3 }
]
//Creating Author (side collection)
const AuthorType = new GraphQLObjectType({
    name:'Author',
    description:'This respresents a Author of book',
    fields:()=>({
        //We dont need resolve if we are returning db objects properties.
        id: { type: new GraphQLNonNull(GraphQLInt)},
        name: { type: new GraphQLNonNull(GraphQLString)},
        books: {
            type: new GraphQLList(BookType),
            resolve:(author)=>{
                return books.filter(book=> book.authorId === author.id)
            }
        }
    })
})
//Creating Book (side collection)
const BookType = new GraphQLObjectType({
    name:'Book',
    description:'This respresents a book',
    fields:()=>({
        //We dont need resolve if we are returning db objects properties.
        id: { type: new GraphQLNonNull(GraphQLInt)},
        name: { type: new GraphQLNonNull(GraphQLString)},
        authorId:{ type: new GraphQLNonNull(GraphQLInt)},
        author:{
            type: AuthorType,
            //Dont have field Author
            //Author is inside bookType(book is the parent of author)
            resolve:(book) =>{
                return authors.find(author => author.id === book.authorId )
            }
        },
    })
})

//Mutation object
const RootMutationType = new GraphQLObjectType({
name:'Mutacije',
description:'CUD operations',
fields: ()=>({
    addBook:{
        type: BookType,
        description: 'Add a book',
        //We need args so we can pass data to server
        args:{
            name:{type: new GraphQLNonNull(GraphQLString),},
            authorId:{type: new GraphQLNonNull(GraphQLInt),}
        },
        resolve:(parent,args) => {
            const book = {
                id:books.length+1,
                name: args.name,
                authorId: args.authorId,
            }
            books.push(book)
            return book
        }
    },
    updateBook:{
        type:BookType,
        description:'Update a book',
        args:{
            id: {type: new GraphQLNonNull(GraphQLInt)},
            newName:{type: new GraphQLNonNull(GraphQLString)},
            authorId: {type:new GraphQLNonNull(GraphQLInt)}
        },
        resolve:(parent,args)=>{
          let updatedBook
          books.forEach((book) => {
                if(book.id === args.id){
                    book.name = args.newName
                    book.authorId = args.authorId
                    updatedBook = book
                }
          });
          return updatedBook
        }
    },
     deleteBook:{
         type: BookType,
         description: 'Delete a book',
         args:{
             id:{type: GraphQLInt}
         },
         resolve:(parent,args)=> {
            _.remove(books,(book)=> book.id === args.id)
            return null
         }
       
     }   
    })
})

//Query(Main Collection)
const RootQueryType = new GraphQLObjectType({
    name:'DrugiUpit',
    description:'Bazni Upit',
    //Returns a function instead of object
    fields: ()=>({
        //Getting single book
        book:{
            type: BookType,
            description:'One book',
            //function for returning data
            //Arguments of resolve
            args:{
                id: {type: GraphQLInt}
            },
            //Getting single books using argument
            resolve:(parent,args) => books.find(book=> book.id === args.id)
        },
        books: {
            //Returning list of book types
            type: new GraphQLList(BookType),
            description:'List of All Books',
            //function for returning data
            resolve:() => books
        },
        authors: {
            //Returning list of book types
            type: new GraphQLList(AuthorType),
            description:'List of Authors',
            //function for returning data
            resolve:() => authors
        },
        author:{
            type: AuthorType,
            description:'Single Author',
            //args - (id:2)
            args:{
                id:{type: GraphQLInt}
            },
            resolve:(parent,args)=> authors.find(author => author.id === args.id)
        }
    })
})
//Schema for query
const schema = new GraphQLSchema({
    query: RootQueryType,
    mutation: RootMutationType,
})


app.use('/graphql', expressGraphQL({
    graphiql:true,
    schema: schema,
}))
app.listen(5000, ()=> console.log('Radi server.'))