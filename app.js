const express = require("express");
const app = express();
app.use(express.json());

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const getStatus = (requestQuery) => {
  return requestQuery.status !== undefined;
};

const getPriority = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const getStatusAndPriority = (requestQuery) => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  );
};

app.get("/todos", async (request, response) => {
  let getTodoQuery = "";
  const { search_q = "", status, priority } = request.query;
  switch (true) {
    case getStatusAndPriority(request.query):
      getTodoQuery = `
      SELECT
        *
      FROM
        todo 
      WHERE
        todo LIKE '%${search_q}%'
        AND status = '${status}'
        AND priority = '${priority}';`;
      break;
    case getStatus(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE
          status = '${status}';`;

      break;
    case getPriority(request.query):
      getTodoQuery = `SELECT * FROM todo WHERE
          priority = '${priority}';`;
      break;

    default:
      getTodoQuery = `SELECT * FROM 
      todo
      WHERE
       todo LIKE '%${search_q}%';`;
  }
  const todoQuery = await db.all(getTodoQuery);
  response.send(todoQuery);
});

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const getTodoObject = `SELECT * FROM todo WHERE id=${todoId};`;
  const todoObj = await db.get(getTodoObject);
  response.send(todoObj);
});

app.post("/todos", async (request, response) => {
  const { id, todo, priority, status } = request.body;
  const createTodoObject = `INSERT INTO todo (id,todo,priority,status) 
    VALUES (${id},'${todo}','${priority}','${status}');`;
  await db.run(createTodoObject);
  response.send("Todo Successfully Added");
});

app.put("/todos/:todoId", async (request, response) => {
  const requestBody = request.body;
  const { todoId } = request.params;
  let updateMessage = "";
  let updateTodo = "";
  let updateTodoObject = "";
  switch (true) {
    case requestBody.status !== undefined:
      updateTodo = requestBody.status;
      updateMessage = "Status";
      updateTodoObject = `UPDATE todo SET status='${updateTodo}'
      WHERE id=${todoId};`;
      break;
    case requestBody.priority !== undefined:
      updateMessage = "Priority";
      updateTodo = requestBody.priority;
      updateTodoObject = `UPDATE todo SET priority='${updateTodo}'
      WHERE id=${todoId};`;
      break;
    case requestBody.todo !== undefined:
      updateMessage = "Todo";
      updateTodo = requestBody.todo;
      updateTodoObject = `UPDATE todo SET todo='${updateTodo}'
      WHERE id=${todoId};`;
      break;
  }
  const updatedTodo = await db.run(updateTodoObject);
  response.send(`${updateMessage} Updated`);
});

app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodo = `DELETE FROM todo WHERE id=${todoId};`;
  const deletedTodo = await db.run(deleteTodo);
  response.send("Todo Deleted");
});

module.exports = app;
