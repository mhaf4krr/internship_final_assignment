const express = require("express")

const app = express()

app.engine('html', require('ejs').renderFile);

app.set("view engine","html")

const bodyParser = require("body-parser")

app.use(bodyParser.urlencoded({extended:true}))

app.use(express.static("public"))

/* Mongo Config */
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL

//'mongodb://hyder:root_linux123@ds047107.mlab.com:47107/exercise';
const url = 'mongodb://localhost:27017';
ObjectID = require('mongodb').ObjectID
// Database Name

let client


/* BASIC ROUTE HANDLING */

app.get ("/",async(req,res)=>{

    let data = await renderIndexPage()
    await client.close()
    res.render("index",{states:data.states,stats:data.stats})
})


app.get("/data",async (req,res)=>{
    let data = await renderIndexPage()
    await client.close()
    res.send(JSON.stringify(data))
})

app.get("/getCollegeData",async (req,res)=>{
    let college = req.query.college

    let data = await queryDatabase("collegeData",{name:college})
    college = data[0]



    let student_list = await queryDatabase("studentData",{college_id:college.name})
    let similar_colleges =  await getSimilarColleges(college)
    

    res.render("college",{college:college , students:student_list, similar_colleges:similar_colleges})
})


app.get("/getStateData",async (req,res)=>{

    try {
          
    let state = req.query.state
    
    let data = await queryDatabase('collegeData',{state:state})

    res.render("state",{colleges:data,state:state})

    } catch (error) {
        console.log(error)
    }
})


app.get("/get-courses-data",async (req,res)=>{
    let data = await getCourseData()
    res.send(JSON.stringify(data))
})


app.get("/getStudentData",async (req,res)=>{
    let student_id = req.query.student

    console.log(student_id)
    let student = await queryDatabase('studentData',{_id:ObjectID(student_id)})
    student = student[0]
    res.render("student",{student:student})

})

async function getSimilarColleges(college){


    let courses = college.courses

    let filter = {$and : [{state:college.state},{name:{$ne:college.name}}]}
    let similar_collges_location = await queryDatabase('collegeData',filter)

    return similar_collges_location
}


/* Mongo Helper Methods Retrives list of Colleges  */
async  function retreiveCollegeData(){

    
    try {

        client = await MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true });
        const dbName = 'exercise';

        const db = client.db(dbName)
        let collection = db.collection('collegeData')
        let result = await collection.find({}).toArray()
        return  result
        
    } catch (error) {   
        console.log(err)
    }
    
}


/* General Purpose Query Function [very important] */


async function queryDatabase(collection_name,filter){
     
    try {

        client = await MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true });
        const dbName = 'exercise';

        const db = client.db(dbName)
        let collection = db.collection(collection_name)
        let result = await collection.find(filter).toArray()
        return  result
        
    } catch (error) {   
        console.log(error)
    }
    
}



/* helper function used to draw courses chart */

async function getCourseData(){
    let courses = [
        'Computer Science',
        'Mechanical Engineering',
        'Electrical Engineering',
        'BioTechnology',
        'Civil Engineering',
        'Electronics Engineering',
        'Information Technology',
        'Nursing',
        'Medical',
        'Food Technology'
      ]
      let courses_data = {}

      let data = await retreiveCollegeData()
      
      data.forEach((college)=>{
          let courses = college.courses
          for(let i=0 ;i< courses.length ;i++){
              if(courses_data[`${courses[i]}`] === undefined){
                courses_data[`${courses[i]}`] = 1
              }

              else {
                courses_data[`${courses[i]}`] += 1
              }
          }
      })


      return courses_data
      
}






function showStateStats(data){
    let statesdata = {}
    
    data.forEach((college)=>{
    
        let state = college.state

        if(statesdata[`${state}`] === undefined){
            statesdata[`${state}`] = 1
        }

        else {
            statesdata[`${state}`] += 1   
        }
    }) 
    return statesdata
} 


/* renders the index page */

async function renderIndexPage(){
    let data = await retreiveCollegeData()
    let stats = showStateStats(data)

    let states = Object.keys(stats)
    return {
        states:states,
        stats:stats
    }
}


app.listen(3002)