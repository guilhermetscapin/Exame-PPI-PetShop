import express from "express";
import cookieParser from "cookie-parser";
import session from "express-session";

const host = "0.0.0.0";
const porta = 3000;

const server = express();

var listaInteressados = [];
var listaPets = [];
var listaAdocoes = [];

server.use(session({
    secret: "chaveSecreta",
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 30 }
}));

server.use(express.urlencoded({ extended: true }));
server.use(cookieParser());

// ====== FUNÇÃO BASE HTML ======
function paginaBase(titulo, conteudo) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>${titulo}</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet">
    </head>
    <body class="bg-light">
        <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
            <div class="container">
                <a class="navbar-brand" href="/">Adoção de Pets</a>
                <div>
                    <a class="btn btn-outline-light btn-sm" href="/logout">Sair</a>
                </div>
            </div>
        </nav>

        <div class="container mt-4">
            ${conteudo}
        </div>
    </body>
    </html>
    `;
}

// ====== LOGIN ======
server.get("/login", (req, res) => {
    res.send(paginaBase("Login", `
        <div class="row justify-content-center">
            <div class="col-md-4">
                <div class="card p-4 shadow">
                    <h4 class="text-center mb-3">Login</h4>
                    <form method="POST" action="/login">
                        <div class="mb-3">
                            <label class="form-label">Usuário</label>
                            <input class="form-control" name="usuario">
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Senha</label>
                            <input type="password" class="form-control" name="senha">
                        </div>
                        <button class="btn btn-primary w-100">Entrar</button>
                    </form>
                </div>
            </div>
        </div>
    `));
});

server.post("/login", (req, res) => {
    const { usuario, senha } = req.body;
    if (usuario === "admin" && senha === "admin") {
        req.session.logado = true;
        res.redirect("/");
    } else {
        res.send(paginaBase("Erro", `
            <div class="alert alert-danger">Usuário ou senha inválidos</div>
            <a href="/login" class="btn btn-secondary">Voltar</a>
        `));
    }
});

server.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
});

// ====== MENU ======
server.get("/", verificarUsuarioLogado, (req, res) => {
    const ultimoAcesso = req.cookies.ultimoAcesso;
    res.cookie("ultimoAcesso", new Date().toLocaleString());

    res.send(paginaBase("Menu", `
        <div class="card p-4 shadow">
            <h3 class="mb-3">Menu do Sistema</h3>
            <p><strong>Último acesso:</strong> ${ultimoAcesso || "Primeiro acesso"}</p>

            <div class="list-group">
                <a class="list-group-item list-group-item-action" href="/cadastroInteressado">Cadastro de Interessados</a>
                <a class="list-group-item list-group-item-action" href="/cadastroPet">Cadastro de Pets</a>
                <a class="list-group-item list-group-item-action" href="/adocao">Adotar um Pet</a>
            </div>
        </div>
    `));
});

// ====== INTERESSADOS ======
server.get("/cadastroInteressado", verificarUsuarioLogado, (req, res) => {
    res.send(paginaBase("Interessados", `
        <div class="card p-4 shadow">
            <h4>Cadastro de Interessado</h4>
            <form method="POST" action="/adicionarInteressado">
                <div class="mb-3">
                    <label class="form-label">Nome</label>
                    <input class="form-control" name="nome">
                </div>
                <div class="mb-3">
                    <label class="form-label">Email</label>
                    <input class="form-control" name="email">
                </div>
                <div class="mb-3">
                    <label class="form-label">Telefone</label>
                    <input class="form-control" name="telefone">
                </div>
                <button class="btn btn-primary">Cadastrar</button>
                <a href="/" class="btn btn-secondary">Menu</a>
            </form>
        </div>
    `));
});

server.post("/adicionarInteressado", verificarUsuarioLogado, (req, res) => {
    const { nome, email, telefone } = req.body;
    if (nome && email && telefone) {
        listaInteressados.push({ nome, email, telefone });
        res.redirect("/listarInteressados");
    } else {
        res.send(paginaBase("Erro", `
            <div class="alert alert-danger">Todos os campos são obrigatórios</div>
            <a href="/cadastroInteressado" class="btn btn-secondary">Voltar</a>
        `));
    }
});

server.get("/listarInteressados", verificarUsuarioLogado, (req, res) => {
    let linhas = listaInteressados.map(i => `
        <tr>
            <td>${i.nome}</td>
            <td>${i.email}</td>
            <td>${i.telefone}</td>
        </tr>
    `).join("");

    res.send(paginaBase("Lista", `
        <div class="card p-4 shadow">
            <h4>Interessados Cadastrados</h4>
            <table class="table table-striped">
                <thead>
                    <tr><th>Nome</th><th>Email</th><th>Telefone</th></tr>
                </thead>
                <tbody>${linhas}</tbody>
            </table>
            <a href="/cadastroInteressado" class="btn btn-primary">Novo</a>
            <a href="/" class="btn btn-secondary">Menu</a>
        </div>
    `));
});

// ====== PETS ======
server.get("/cadastroPet", verificarUsuarioLogado, (req, res) => {
    res.send(paginaBase("Pets", `
        <div class="card p-4 shadow">
            <h4>Cadastro de Pet</h4>
            <form method="POST" action="/adicionarPet">
                <div class="mb-3">
                    <label class="form-label">Nome</label>
                    <input class="form-control" name="nome">
                </div>
                <div class="mb-3">
                    <label class="form-label">Raça</label>
                    <input class="form-control" name="raca">
                </div>
                <div class="mb-3">
                    <label class="form-label">Idade</label>
                    <input type="number" class="form-control" name="idade">
                </div>
                <button class="btn btn-primary">Cadastrar</button>
                <a href="/" class="btn btn-secondary">Menu</a>
            </form>
        </div>
    `));
});

server.post("/adicionarPet", verificarUsuarioLogado, (req, res) => {
    const { nome, raca, idade } = req.body;
    if (nome && raca && idade) {
        listaPets.push({ nome, raca, idade });
        res.redirect("/listarPets");
    } else {
        res.send(paginaBase("Erro", `
            <div class="alert alert-danger">Todos os campos são obrigatórios</div>
            <a href="/cadastroPet" class="btn btn-secondary">Voltar</a>
        `));
    }
});

server.get("/listarPets", verificarUsuarioLogado, (req, res) => {
    let linhas = listaPets.map(p => `
        <tr>
            <td>${p.nome}</td>
            <td>${p.raca}</td>
            <td>${p.idade}</td>
        </tr>
    `).join("");

    res.send(paginaBase("Pets", `
        <div class="card p-4 shadow">
            <h4>Pets Cadastrados</h4>
            <table class="table table-striped">
                <thead>
                    <tr><th>Nome</th><th>Raça</th><th>Idade</th></tr>
                </thead>
                <tbody>${linhas}</tbody>
            </table>
            <a href="/cadastroPet" class="btn btn-primary">Novo</a>
            <a href="/" class="btn btn-secondary">Menu</a>
        </div>
    `));
});

server.get("/adocao", verificarUsuarioLogado, (req, res) => {
    let interessados = listaInteressados.map((i, idx) =>
        `<option value="${idx}">${i.nome}</option>`).join("");

    let pets = listaPets.map((p, idx) =>
        `<option value="${idx}">${p.nome}</option>`).join("");

    res.send(paginaBase("Adoção", `
        <div class="card p-4 shadow">
            <h4>Adotar um Pet</h4>
            <form method="POST" action="/adicionarAdocao">
                <div class="mb-3">
                    <label class="form-label">Interessado</label>
                    <select class="form-select" name="interessado">
                        <option value="">Selecione</option>
                        ${interessados}
                    </select>
                </div>
                <div class="mb-3">
                    <label class="form-label">Pet</label>
                    <select class="form-select" name="pet">
                        <option value="">Selecione</option>
                        ${pets}
                    </select>
                </div>
                <button class="btn btn-success">Registrar Adoção</button>
                <a href="/" class="btn btn-secondary">Menu</a>
            </form>
        </div>
    `));
});

server.post("/adicionarAdocao", verificarUsuarioLogado, (req, res) => {
    const { interessado, pet } = req.body;
    if (interessado !== "" && pet !== "") {
        listaAdocoes.push({
            interessado: listaInteressados[interessado].nome,
            pet: listaPets[pet].nome,
            data: new Date().toLocaleString()
        });
        res.redirect("/listarAdocoes");
    } else {
        res.send(paginaBase("Erro", `
            <div class="alert alert-danger">Selecione interessado e pet</div>
            <a href="/adocao" class="btn btn-secondary">Voltar</a>
        `));
    }
});

server.get("/listarAdocoes", verificarUsuarioLogado, (req, res) => {
    let linhas = listaAdocoes.map(a => `
        <tr>
            <td>${a.interessado}</td>
            <td>${a.pet}</td>
            <td>${a.data}</td>
        </tr>
    `).join("");

    res.send(paginaBase("Adoções", `
        <div class="card p-4 shadow">
            <h4>Adoções Registradas</h4>
            <table class="table table-striped">
                <thead>
                    <tr><th>Interessado</th><th>Pet</th><th>Data</th></tr>
                </thead>
                <tbody>${linhas}</tbody>
            </table>
            <a href="/adocao" class="btn btn-primary">Nova</a>
            <a href="/" class="btn btn-secondary">Menu</a>
        </div>
    `));
});

function verificarUsuarioLogado(req, res, next) {
    if (req.session.logado) next();
    else res.redirect("/login");
}

server.listen(porta, host, () => {
    console.log(`Servidor rodando em http://${host}:${porta}`);
});