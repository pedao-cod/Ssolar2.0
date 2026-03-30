// 1. Importando o Firebase diretamente da internet (via CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// NOVIDADE: Importando a ferramenta de Autenticação (Cofre de senhas do Firebase)
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// 2. A sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDjlFWug5X9801X0dGR1pPjp8fgcB-gzxk",
  authDomain: "ssolar-sergipe.firebaseapp.com",
  databaseURL: "https://ssolar-sergipe-default-rtdb.firebaseio.com",
  projectId: "ssolar-sergipe",
  storageBucket: "ssolar-sergipe.firebasestorage.app",
  messagingSenderId: "640715367247",
  appId: "1:640715367247:web:4bff3cbb32a24967951b3a",
};

// 3. Inicializando o Firebase e o Banco de Dados (Firestore)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
// NOVIDADE: Inicializando o Cofre de Senhas
const auth = getAuth(app);

// Como estamos usando "module", precisamos pendurar a função de excluir na "janela" do navegador
window.excluirCliente = async function (idDoCliente) {
  if (confirm("Tem certeza que deseja excluir este cliente definitivamente?")) {
    try {
      // Apaga o documento no banco de dados nas nuvens usando o ID
      await deleteDoc(doc(db, "clientes", idDoCliente));
      alert("Cliente excluído com sucesso!");
      location.reload(); // Recarrega para atualizar a tabela
    } catch (erro) {
      console.error("Erro ao excluir: ", erro);
      alert("Erro ao excluir. Tente novamente.");
    }
  }
};

document.addEventListener("DOMContentLoaded", async function () {
  // =========================================================================
  // LÓGICA DO CADASTRO (Enviando para a Nuvem e para o Auth)
  // =========================================================================
  const formCadastro = document.getElementById("formCadastro");

  if (formCadastro) {
    formCadastro.addEventListener("submit", async function (event) {
      event.preventDefault();

      // Muda o texto do botão para mostrar que está carregando
      const btnEnviar = document.querySelector(".enviar");
      btnEnviar.innerText = "Enviando...";
      btnEnviar.disabled = true;

      try {
        // NOVIDADE: Pegamos o e-mail e a senha em variáveis separadas
        const emailCadastro = document.getElementById("email").value;
        const senhaCadastro = document.getElementById("senha").value;

        // NOVIDADE: 1º PASSO - Cria o usuário no "Cofre" do Firebase Auth (Senhas Criptografadas)
        await createUserWithEmailAndPassword(
          auth,
          emailCadastro,
          senhaCadastro,
        );

        // NOVIDADE: 2º PASSO - Salva os dados no banco de dados Firestore (Repare que tirei a 'senha' daqui para não ficar visível a hackers!)
        await addDoc(collection(db, "clientes"), {
          nome: document.getElementById("nome").value,
          email: emailCadastro,
          idade: document.getElementById("idade").value,
          telefone: document.getElementById("telefone").value,
          cidade: document.getElementById("cidade").value,
          potencia: document.getElementById("potencia").value,
        });

        alert("Cadastro realizado com segurança! ☀️");
        window.location.href = "usuarios.html";
      } catch (erro) {
        // NOVIDADE: Tratamento de erros inteligente!
        if (erro.code === "auth/email-already-in-use") {
          alert(
            "Esse e-mail já está cadastrado! Vamos redirecioná-lo para a página de login.",
          );
          window.location.href = "login.html";
        } else if (erro.code === "auth/weak-password") {
          alert(
            "A senha é muito fraca. Ela precisa ter pelo menos 6 caracteres!",
          );
        } else {
          console.error("Erro ao cadastrar: ", erro);
          alert("Erro ao conectar com o servidor.");
        }

        btnEnviar.innerText = "Enviar Cadastro";
        btnEnviar.disabled = false;
      }
    });
  }

  // =========================================================================
  // LÓGICA DO LOGIN (Consultando a Nuvem)
  // =========================================================================
  const formLogin = document.getElementById("formLogin");

  if (formLogin) {
    formLogin.addEventListener("submit", async function (event) {
      event.preventDefault();

      const emailDigitado = document.getElementById("email").value;
      const senhaDigitada = document.getElementById("senha").value;

      try {
        // Faz uma "pergunta" ao banco: Tem alguém com esse e-mail e essa senha?
        const q = query(
          collection(db, "clientes"),
          where("email", "==", emailDigitado),
          where("senha", "==", senhaDigitada),
        );

        const resultado = await getDocs(q);

        // Se achar algum resultado, faz o login
        if (!resultado.empty) {
          let nomeUsuario = "";
          resultado.forEach((doc) => {
            nomeUsuario = doc.data().nome;
          });

          alert(`Bem-vindo(a) de volta, ${nomeUsuario}!`);
          window.location.href = "home.html";
        } else {
          alert("E-mail ou senha incorretos. Tente novamente!");
        }
      } catch (erro) {
        console.error("Erro ao fazer login: ", erro);
      }
    });
  }

  // =========================================================================
  // LÓGICA DA TABELA DE USUÁRIOS (Puxando dados da Nuvem)
  // =========================================================================
  const corpoTabela = document.querySelector("table tbody");

  if (corpoTabela) {
    corpoTabela.innerHTML =
      "<tr><td colspan='7'>Carregando dados da nuvem... ⏳</td></tr>";

    try {
      // Busca TODOS os documentos que estão na coleção "clientes"
      const querySnapshot = await getDocs(collection(db, "clientes"));

      corpoTabela.innerHTML = ""; // Limpa a mensagem de carregando

      if (querySnapshot.empty) {
        corpoTabela.innerHTML =
          "<tr><td colspan='7'>Nenhum cliente cadastrado no sistema ainda.</td></tr>";
      } else {
        // Para cada cliente encontrado na nuvem, cria uma linha na tabela
        querySnapshot.forEach(function (documento) {
          const cliente = documento.data(); // Pega as informações
          const idCliente = documento.id; // Pega a ID única do Firebase

          const tr = document.createElement("tr");
          tr.innerHTML = `
                        <td>${cliente.nome}</td>
                        <td>${cliente.email}</td>
                        <td>${cliente.idade}</td>
                        <td>${cliente.telefone}</td>
                        <td>${cliente.cidade}</td>
                        <td>${cliente.potencia ? cliente.potencia + " kWp" : "N/A"}</td>
                        <td>
                            <button class="botao-excluir" onclick="excluirCliente('${idCliente}')">Excluir</button>
                        </td>
                    `;
          corpoTabela.appendChild(tr);
        });
      }
    } catch (erro) {
      console.error("Erro ao carregar tabela: ", erro);
      corpoTabela.innerHTML =
        "<tr><td colspan='7'>Erro ao carregar os dados.</td></tr>";
    }
  }
});
