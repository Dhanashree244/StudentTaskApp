const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Student Task Manager</title>
<style>
body{font-family:Arial,sans-serif;background:#f4f7fb;margin:0;color:#233044}
main{max-width:850px;margin:40px auto;padding:24px}
.panel{background:white;padding:24px;border-radius:12px;box-shadow:0 3px 14px #0001}
h1{margin-top:0;color:#2457a7}
form,.filters{display:flex;gap:10px;flex-wrap:wrap;margin:16px 0}
input,select,button{padding:11px;border:1px solid #ccd4df;border-radius:7px;font-size:14px}
input{flex:1;min-width:150px}
button{cursor:pointer;background:#2457a7;color:white;border:0}
button.secondary{background:#65758b}
button.danger{background:#c0392b}
.task{padding:15px 0;border-bottom:1px solid #e4e8ef}
.task h3{margin:0 0 8px}
.meta{font-size:13px;color:#596579;margin-bottom:10px}
.actions{display:flex;gap:8px;flex-wrap:wrap}
#message{margin:12px 0;color:#2457a7}
</style>
</head>
<body>
<main>
<div class="panel">
<h1>Student Task Manager</h1>
<p>Create, update, complete, and delete your tasks.</p>
<form id="taskForm">
<input id="title" placeholder="Enter task title" required maxlength="150">
<select id="priority">
<option value="Low">Low priority</option>
<option value="Medium" selected>Medium priority</option>
<option value="High">High priority</option>
</select>
<button type="submit">Add Task</button>
</form>
<div id="message" role="status"></div>
<div class="filters">
<label>Filter:
<select id="filter">
<option value="All">All tasks</option>
<option value="Pending">Pending</option>
<option value="Completed">Completed</option>
</select>
</label>
<button class="secondary" id="refresh">Refresh Tasks</button>
</div>
<div id="tasks">Loading tasks...</div>
</div>
</main>
<script>
const tasksBox = document.getElementById('tasks');
const message = document.getElementById('message');
let tasks = [];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function(ch) {
    return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch];
  });
}

async function api(url, options) {
  const response = await fetch(url, options || {});
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

async function loadTasks() {
  tasksBox.textContent = 'Loading tasks...';
  try {
    tasks = await api('/api/tasks');
    renderTasks();
    message.textContent = '';
  } catch (error) {
    tasksBox.textContent = 'Could not load tasks.';
    message.textContent = error.message;
  }
}

function renderTasks() {
  const filter = document.getElementById('filter').value;
  const shown = tasks.filter(function(task) {
    return filter === 'All' || task.status === filter;
  });

  if (!shown.length) {
    tasksBox.innerHTML = '<p>No tasks to display. Add your first task above.</p>';
    return;
  }

  tasksBox.innerHTML = shown.map(function(task) {
    return '<div class="task">' +
      '<h3>' + escapeHtml(task.title) + '</h3>' +
      '<div class="meta">Priority: ' + escapeHtml(task.priority) +
      ' | Status: ' + escapeHtml(task.status) +
      ' | Created: ' + escapeHtml(new Date(task.createdAt).toLocaleString()) +
      '</div><div class="actions">' +
      '<button data-action="edit" data-id="' + escapeHtml(task.id) + '" class="secondary">Edit</button>' +
      '<button data-action="status" data-id="' + escapeHtml(task.id) + '">' +
      (task.status === 'Completed' ? 'Mark Pending' : 'Complete') + '</button>' +
      '<button data-action="delete" data-id="' + escapeHtml(task.id) + '" class="danger">Delete</button>' +
      '</div></div>';
  }).join('');
}

document.getElementById('taskForm').addEventListener('submit', async function(event) {
  event.preventDefault();
  const title = document.getElementById('title').value.trim();
  const priority = document.getElementById('priority').value;
  if (!title) return;

  try {
    await api('/api/tasks', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({title:title, priority:priority})
    });
    document.getElementById('title').value = '';
    message.textContent = 'Task added successfully.';
    await loadTasks();
  } catch (error) {
    message.textContent = error.message;
  }
});

tasksBox.addEventListener('click', async function(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const id = button.dataset.id;
  const task = tasks.find(function(item) { return item.id === id; });
  if (!task) return;

  try {
    if (button.dataset.action === 'edit') {
      const newTitle = prompt('Edit task title:', task.title);
      if (newTitle === null) return;
      if (!newTitle.trim()) {
        message.textContent = 'Task title cannot be empty.';
        return;
      }

      const newPriority = prompt('Priority: Low, Medium, or High', task.priority);
      if (newPriority === null) return;
      if (!['Low','Medium','High'].includes(newPriority)) {
        message.textContent = 'Enter Low, Medium, or High for priority.';
        return;
      }

      await api('/api/tasks/' + encodeURIComponent(id), {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({title:newTitle.trim(), priority:newPriority, status:task.status})
      });
      message.textContent = 'Task updated.';
    }

    if (button.dataset.action === 'status') {
      await api('/api/tasks/' + encodeURIComponent(id), {
        method:'PUT',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          status: task.status === 'Completed' ? 'Pending' : 'Completed'
        })
      });
      message.textContent = 'Task status updated.';
    }

    if (button.dataset.action === 'delete') {
      if (!confirm('Delete this task?')) return;
      await api('/api/tasks/' + encodeURIComponent(id), {method:'DELETE'});
      message.textContent = 'Task deleted.';
    }

    await loadTasks();
  } catch (error) {
    message.textContent = error.message;
  }
});

document.getElementById('filter').addEventListener('change', renderTasks);
document.getElementById('refresh').addEventListener('click', loadTasks);
loadTasks();
</script>
</body>
</html>`;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}

async function handleApi(request, env, url) {
  if (!env.TASKS_KV) {
    return json({ error: "TASKS_KV binding is missing." }, 500);
  }

  if (url.pathname === "/api/health" && request.method === "GET") {
    return json({ status: "ok", service: "Student Task Manager" });
  }

  if (url.pathname === "/api/tasks" && request.method === "GET") {
    const result = await env.TASKS_KV.list({ prefix: "task:" });
    const values = await Promise.all(
      result.keys.map(key => env.TASKS_KV.get(key.name, "json"))
    );
    return json(values.filter(Boolean));
  }

  if (url.pathname === "/api/tasks" && request.method === "POST") {
    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Request body must be valid JSON." }, 400);
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const priority = body.priority || "Medium";

    if (!title || title.length > 150) {
      return json({ error: "Title is required and must be at most 150 characters." }, 400);
    }
    if (!["Low", "Medium", "High"].includes(priority)) {
      return json({ error: "Priority must be Low, Medium, or High." }, 400);
    }

    const task = {
      id: crypto.randomUUID(),
      title,
      priority,
      status: "Pending",
      createdAt: new Date().toISOString()
    };

    await env.TASKS_KV.put("task:" + task.id, JSON.stringify(task));
    return json(task, 201);
  }

  const match = url.pathname.match(/^\/api\/tasks\/([^/]+)$/);

  if (match) {
    const id = decodeURIComponent(match[1]);
    const key = "task:" + id;

    if (request.method === "GET") {
      const task = await env.TASKS_KV.get(key, "json");
      return task ? json(task) : json({ error: "Task not found." }, 404);
    }

    if (request.method === "PUT") {
      const existing = await env.TASKS_KV.get(key, "json");
      if (!existing) return json({ error: "Task not found." }, 404);

      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Request body must be valid JSON." }, 400);
      }

      const updated = { ...existing };

      if (body.title !== undefined) {
        if (typeof body.title !== "string" || !body.title.trim() || body.title.trim().length > 150) {
          return json({ error: "Title must be between 1 and 150 characters." }, 400);
        }
        updated.title = body.title.trim();
      }

      if (body.priority !== undefined) {
        if (!["Low", "Medium", "High"].includes(body.priority)) {
          return json({ error: "Priority must be Low, Medium, or High." }, 400);
        }
        updated.priority = body.priority;
      }

      if (body.status !== undefined) {
        if (!["Pending", "Completed"].includes(body.status)) {
          return json({ error: "Status must be Pending or Completed." }, 400);
        }
        updated.status = body.status;
      }

      await env.TASKS_KV.put(key, JSON.stringify(updated));
      return json(updated);
    }

    if (request.method === "DELETE") {
      const existing = await env.TASKS_KV.get(key);
      if (existing === null) return json({ error: "Task not found." }, 404);

      await env.TASKS_KV.delete(key);
      return json({ message: "Task deleted successfully.", id });
    }
  }

  return json({ error: "API endpoint not found." }, 404);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    try {
      if (url.pathname.startsWith("/api/")) {
        return await handleApi(request, env, url);
      }

      if (request.method === "GET" && url.pathname === "/") {
        return new Response(HTML, {
          headers: { "Content-Type": "text/html; charset=utf-8" }
        });
      }

      return new Response("Not found", { status: 404 });
    } catch (error) {
      console.error("Worker error:", error);
      return json({ error: "Internal server error." }, 500);
    }
  }
};