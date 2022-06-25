//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const _ =require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
main().catch(err => console.log(err));

async function main() {
  await mongoose.connect("mongodb+srv://PraveshRathore:monty@cluster0.rwseq7a.mongodb.net/todoListDB");
}

const itemsSchema =new mongoose.Schema({
  name:String
});


const Item=mongoose.model("Item",itemsSchema);
const item1 = new Item({
  name: "Welcome to your todoList!"
});
const item2 = new Item({
  name: "Hit the + button to add an item ."
});
const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

const defaultItem =[item1,item2,item3];

const listSchema ={
  name:String,
  items:[itemsSchema]
};

const List=mongoose.model("List",listSchema);



app.get("/", (req, res) => {

  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
     Item.insertMany(defaultItem,(err)=>{
      if (err) {
        console.log(err);
      }
      else{
        console.log("Successfully added the items.");
      }
     });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: foundItems });
    }
  });
});

app.get("/:customnewList",(req,res)=>{
  const customListName =_.capitalize(req.params.customnewList);

  List.findOne({name:customListName},(err,foundList)=>{
    if (!err) {
      if (!foundList) {
        const list = new List({
          name:customListName,
          items:defaultItem
        });
        list.save(); 
        res.redirect("/"+customListName);
      }
      else{
        res.render("list", { listTitle:foundList.name, newListItems: foundList.items });
      }
    }

  });

});

app.post("/", function (req, res) {

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });
  if (listName==="Today") {
    item.save();
    res.redirect("/");
  }
  else{
    List.findOne({name:listName},(err,foundList)=>{
      foundList.items.push(item);
      foundList.save();
      res.redirect("/"+listName);
    })
  }
});

app.post("/delete",(req,res)=>{
  const checkedItemId =req.body.checkBox;
  const listName =req.body.listName;

  if (listName==="Today") {
    Item.findByIdAndRemove(checkedItemId,(err)=>{
      if (err) {
        console.log(err);
      }
      else{
        console.log("SuccessFully Deleted Item");
        res.redirect("/");
      }
    });
    
  }
  else{
    List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkedItemId}}},(err,foundList)=>{
      if (!err) {
        res.redirect("/"+listName);
      }
    });
  }
});


app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(process.env.PORT||3000, function () {
  console.log("Server started on port 3000");
});
