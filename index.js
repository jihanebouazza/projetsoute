if(typeof window == "object"){

}
else{

const path = require('path')
const express = require('express') // importing express
const ejs = require('ejs') //pass data tp html
const app = express() // express function is stored in this app variable
// i will be able to use this app to create a local server
const bodyParser = require('body-parser')
const mysql = require('mysql') 
const session = require('express-session')
const { parse } = require('path')

app.locals.tofixed = (value, precision) =>{
  var precision = precision || 0,
        power = Math.pow(10, precision),
        absValue = Math.abs(Math.round(value * power)),
        result = (value < 0 ? '-' : '') + String(Math.floor(absValue / power));

    if (precision > 0) {
        var fraction = String(absValue % power),
            padding = new Array(Math.max(precision - fraction.length, 0) + 1).join('0');
        result += '.' + padding + fraction;
    }
    return result;
}

mysql.createConnection({ // establishing connection with mysql
  host:"localhost",
  user:"root",
  password:"",
  database:"node_projet"
})

app.use('*/css',express.static('public/css'));
app.use('*/js',express.static('public/js'));
app.use('*/img',express.static('public/img'));
app.set('views', path.join(__dirname, 'views/pages'));
// telling express that want to use html
//app.use(express.static('./public'))// telling express that we want it to use the public folder
app.set('view engine', 'ejs') // telling express that we ant to use ejs as our view engine

// specifiying the port
app.listen(8080) // localhost:8080

app.use(bodyParser.urlencoded({extended:true}))

app.use(session({secret:"secret",
resave:true,
saveUninitialized: true
}))
// key that is important for the session to work properly

function isProductInCart(cart, id){ //id of the product that we ant to check if its the cart or not
  for(let i = 0; i < cart.length; i++){
    if(cart[i].id == id){ // if there is a match
      return true
    }
  }
  return false
}

function calculateTotal(cart, req){// we need req to store total in the session because it has access to the session
  total = 0
  for(let i = 0; i < cart.length; i++){ // we need to loop over each product in the cart to get the price and quantity
    total = total + (cart[i].price * cart[i].quantity)
  }
// we store it in the session
req.session.total = total.toFixed(2)
return total.toFixed(2)
}


app.get('/index.ejs', function(req, res, next) {
  res.render(path.resolve(__dirname,'./public/views/pages/index.ejs'));
});
app.get('/shop.ejs', function(req, res, next) {
 const con = mysql.createConnection({ 
    host:"localhost",
    user:"root",
    password:"",
    database:"node_projet"
  })
  con.query("SELECT * FROM produits",(err,result)=>{
    res.render(path.resolve(__dirname,'./public/views/pages/shop.ejs'),{result:result});
  })
  
});
app.get('/about.ejs', function(req, res, next) {
  res.render(path.resolve(__dirname,'./public/views/pages/about.ejs'));
});

app.get('/sproduct.ejs', function(req, res, next) {
  res.render(path.resolve(__dirname,'./public/views/pages/sproduct.ejs'));
});
// creating a server
app.get('/', function(req, res){
  res.render(path.resolve(__dirname,'./public/views/pages/index.ejs')); // we need to deliver html to the page node knows the views file cause its inside public normally
});

app.post('/add_to_cart', function(req,res){ // we are using a post request
  var id = req.body.id // getting hidden input of the product using they're names
  var name = req.body.name
  var price = req.body.price
  var quantity = req.body.quantity
  var image = req.body.image
  // storing them in a product
  const product = {id:id, name:name, price:price, quantity:quantity, image:image}

  // to add prodcut to cart we need to store it in the session
  // but first we need to check if its the first product or not
  if(req.session.cart){ // if there is an existing cart
    var cart = req.session.cart
    if(!isProductInCart(cart, id)){// if the product is not in the cart
      cart.push(product)
    }
  }
  else{ // if there is no cart
    req.session.cart = [product] // array of one product
    var cart = req.session.cart
  }

  // calculating total
  calculateTotal(cart,req)
  //return to cart page
  res.redirect('/cart.ejs')
})
app.get('/cart.ejs', function(req, res, next) {
  var cart = req.session.cart
  var total = req.session.total
  res.render(path.resolve(__dirname,'./public/views/pages/cart.ejs'),{cart:cart, total:total})
});

app.post('/edit_product_quantity', function(req, res){
  // get values from the inputs
  var id = req.body.id
  var quantity = req.body.quantity
  var increaseBtn = req.body.increase_product_quantity
  var decreaseBtn = req.body.decrease_product_quantity

  var cart = req.session.cart //getting the cart from the sessioj because we need it to increase or decrease qte of the product
  if(increaseBtn){// checking if the user clicked on the increase or decrease button
    for(let i = 0; i < cart.length; i++){
      // to know which product we need to compare it with the cart id
      if(cart[i].id == id){
        // making sure that the qte>0 because it doesnt make sense if it isnt
        if(cart[i].quantity > 0){
          cart[i].quantity = parseInt(cart[i].quantity) + 1
        }
      }
    }
  }
  if(decreaseBtn){// checking if the user clicked on the increase or decrease button
    for(let i = 0; i < cart.length; i++){
      // to know which product we need to compare it with the cart id
      if(cart[i].id == id){
        // making sure that the qte>0 because it doesnt make sense if it isnt
        if(cart[i].quantity > 1){
          cart[i].quantity = parseInt(cart[i].quantity) - 1
        }
      }
    }
  }
   calculateTotal(cart, req)
  res.redirect('/cart.ejs')
})

app.get('/checkout.ejs', function(req, res, next) {
  var total = req.session.total
  res.render(path.resolve(__dirname,'./public/views/pages/checkout.ejs'),{total:total})
})
/*
app.post('/place_order', function(req, res){
  var name = req.body.name
  var email = req.body.email
  var phone = req.body.phone
  var city = req.body.city
  var address = req.body.address
  var cost = req.session.total
  var status = "impayé"
  var date= new Date()
  var products_ids = ""
// inserting these into the database 
  var con = mysql.createConnection({ // establishing connection with mysql
    host:"localhost",
    user:"root",
    password:"",
    database:"node_projet"
  })
  var cart = req.session.cart // to get products_ids we need to use the session
  for(let i = 0; i < cart.length; i++){
    // append the ids of the products to the products_ids
    products_ids = products_ids + "," + cart[i].id
  }
  // using con to connect to the database
  con.connect((err)=>{
    if(err){ // if there is an error we display it 
      console.log(err)
    }
    else{  // if there is no error we insert the data into the database
      // a quey that will insert to the database
      var query = "INSERT INTO commandes(cost,name,email,status,city,address,phone,date,products_ids) VALUES ?"
      // creating an array with the values that we want to insert into the database
      var values = [ // if its not a double array its not gonna work
      [cost,name,email,status,city,address,phone,date,products_ids]
      ] // these values will replace the question mark
      con.query(query,[values],(err, result)=>{
        res.redirect('/payment.ejs')
      })
    }
  })
})
*/
//app.get('/payment.ejs', function(req, res, next) {
//   res.render(path.resolve(__dirname,'./public/views/pages/payment.ejs'))
// });
/*
app.get('/payment.ejs', function(req, res, next) {
  const con = mysql.createConnection({ 
     host:"localhost",
     user:"root",
     password:"",
     database:"node_projet"
   })
   con.query("SELECT * FROM commandes ORDER BY id DESC LIMIT 1",(err,result)=>{
     res.render(path.resolve(__dirname,'./public/views/pages/payment.ejs'),{result:result});
   })
   
 });
*/
 app.post('/place_order', function(req, res){
  var name = req.body.name
  var prenom = req.body.prenom
  var email = req.body.email
  var phone = req.body.phone
  var city = req.body.city
  var address = req.body.address
  var cost = req.session.total
  var date= new Date()
// inserting these into the database 
  var con = mysql.createConnection({ // establishing connection with mysql
    host:"localhost",
    user:"root",
    password:"",
    database:"node_projet",
  //  multipleStatements: true
  })
  var cart = req.session.cart // to get products_ids we need to use the session
  // using con to connect to the database
  con.connect((err)=>{
    if(err){ // if there is an error we display it 
      console.log(err)
    }
    else{  // if there is no error we insert the data into the database
      // a quey that will insert to the database
      var name_id;
      var commande_id; 
      var query = "INSERT INTO client(name,prenom,email,city,address,phone) VALUES ?"
      // creating an array with the values that we want to insert into the database
      var values = [ // if its not a double array its not gonna work
      [name,prenom,email,city,address,phone]
      ] 
      con.query(query,[values],(err, result)=>{
        if (err) throw err;
        name_id = result.insertId// these values will replace the question mark
      query = "INSERT INTO commande(id_client,date) VALUES ?"
      var values = [ // if its not a double array its not gonna work
      [name_id,date]
      ] 
      con.query(query,[values],(err, result)=>{
        if (err) throw err;
        commande_id = result.insertId
        query = "INSERT INTO facture(id_commande,total) VALUES ?"
        var values = [ // if its not a double array its not gonna work
        [commande_id,cost]
        ] 
        con.query(query,[values],(err, result)=>{
          if (err) throw err;
          for(let i = 0; i < cart.length; i++){
          query = "INSERT INTO commande_produit(id_produit,id_commande,qte) VALUES ?"
          var values = [ // if its not a double array its not gonna work
          [cart[i].id,commande_id,cart[i].quantity]
          ] 
         
          con.query(query,[values],(err, result)=>{
            if (err) throw err; 
            
          })    }
          res.redirect('/payment.ejs')
          })    
      })
    })
    }
  })
})

/*
app.get('/payment.ejs', function(req, res, next) {
  const con = mysql.createConnection({ 
     host:"localhost",
     user:"root",
     password:"",
     database:"node_projet",
   })
   con.query("SELECT * FROM commande ORDER BY id DESC LIMIT 1;SELECT * FROM commande ORDER BY id DESC LIMIT 1;SELECT * FROM facture ORDER BY id DESC LIMIT 1",(err,result)=>{
     res.render(path.resolve(__dirname,'./public/views/pages/payment.ejs'),{result:result});
   })
   
 });*/

 app.get('/payment.ejs', function(req, res, next) {
  var cart = req.session.cart
  const con = mysql.createConnection({ 
    host:"localhost",
    user:"root",
    password:"",
    database:"node_projet",
  })
  var sql1 = 'SELECT * FROM client ORDER BY id_client DESC LIMIT 1';
  var sql2 = 'SELECT * FROM facture ORDER BY id_facture DESC LIMIT 1';
  con.query(sql1, function(err, result){
      if (err) throw err; //you should use this for error handling when in a development environment
      con.query(sql2, function(err, facture) {
          if (err) throw err;
          res.render(path.resolve(__dirname,'./public/views/pages/payment.ejs'),{result:result,facture:facture,cart:cart});
      });  
  });
});
/*
app.get('/install', function(req, res, next) {
  var cart = req.session.cart
  const con = mysql.createConnection({ 
    host:"localhost",
    user:"root",
    password:"",
    database:"node_projet",
  })
  var sql1 = 'SELECT * FROM client ORDER BY id_client DESC LIMIT 1';
  var sql2 = 'SELECT * FROM facture ORDER BY id_facture DESC LIMIT 1';
  con.query(sql1, function(err, result){
      if (err) throw err; //you should use this for error handling when in a development environment
      con.query(sql2, function(err, facture) {
          if (err) throw err;
      }); 
      res.render(path.resolve(__dirname,'./public/views/pages/demopdf.ejs'),{result:result,cart:cart}, function(err,html){
        pdf.create(html,options).tofile('./public/views/pages/demopdf.ejs', function(err, res){
          if (err){
            return console.log(err);
          }else{
            console.log(res);
            var datafile = fs.readFileSync('./public/views/pages/demopdf.ejs');
            res.header('content-type','install/pdf');
            res.send(datafile);
          }
        })
      }); 
  });

})*/


}