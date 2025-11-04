# MACHS – Ambiente Isolado de Testes do FABEO

**Branch:** `test-fabeo-isolated`

Este repositório disponibiliza um ambiente **mínimo e isolado** para testes de criptografia ABE (Attribute-Based Encryption) utilizando o **FABEO (Fast Attribute-Based Encryption Operations)** [(Riepel, 2022))](https://github.com/DoreenRiepel/FABEO) O branch contém apenas os componentes criptográficos necessários para operações de encriptação/decriptação e geração de chaves, expostos via API REST.

> Para o sistema hospitalar completo (frontend, backend EHR e banco de dados), utilize os branches `main` ou `base-structure`.

---

## 1. Arquitetura do Sistema (Isolado)

O ambiente isolado é composto por dois serviços principais, orquestrados via Docker Compose:

* **Crypto API (porta 8001)**

  * Python 3.8+ com FastAPI
  * Endpoints REST para encriptação, decriptação, geração de chaves e verificação de saúde
  * Documentação OpenAPI disponível em `/docs`

* **FABEO Service (porta 8002)**

  * Python 2.7 com Charm-crypto 0.43 e Flask
  * Implementações FABEO22 (CP-ABE e KP-ABE)
  * Atendido pela Crypto API via HTTP

* **Armazenamento em arquivos**

  * Estrutura `storage/` (vazia por padrão): `patients/`, `encounters/`, `conditions/`
  * Destinada a armazenar artefatos criptografados quando necessário

---

## 2. Escopo deste Branch

### Inclui

* Submódulo **FABEO** (FABEO22) como Git submodule
* **Crypto API Gateway** (FastAPI)
* **FABEO Microservice** (Flask, Python 2.7 + Charm-crypto)
* **Infraestrutura Docker** (Docker Compose)
* **Scripts de teste** e **utilitários**
* Suporte a múltiplos esquemas ABE (CP-ABE, KP-ABE, DFA, Waters11, Waters12) conforme implementado pelo FABEO

### Não inclui (disponível em outros branches)

* Frontend/UI e simulação do hospital → ver `main`
* Backend EHR e banco de dados → ver `base-structure`
* Dados de pacientes de exemplo → ver `base-structure`

---

## 3. Pré-requisitos

* Docker e Docker Compose
* Git (para inicialização de submódulos)

---

## 4. Obtenção do Código

```bash
git clone --recursive https://github.com/tomoutsuki/MACHS.git
cd MACHS
git checkout test-fabeo-isolated
```

Se o clone foi feito sem `--recursive`:

```bash
git submodule update --init --recursive
```

---

## 5. Subida dos Serviços (Docker)

```bash
cd docker
docker-compose up --build -d
```

Ver logs:

```bash
docker-compose logs -f
docker-compose logs -f fabeo-service
docker-compose logs -f crypto-api
```

Parar serviços:

```bash
docker-compose down
```

Rebuild sem cache:

```bash
docker-compose build --no-cache
docker-compose up -d
```

---

## 6. Verificação Rápida

Saúde dos serviços:

```bash
curl http://localhost:8001/health
curl http://localhost:8002/health
```

Documentação da API (navegador):

* Crypto API (OpenAPI/Swagger): `http://localhost:8001/docs`

---

## 7. API de Criptografia

### Esquemas Disponíveis (conforme suporte do FABEO)

* **CP-ABE**: `fabeo22cp`, `ac17cp`, `waters11cp`
* **KP-ABE**: `fabeo22kp`, `ac17kp`
* **DFA**: `fabeo22dfa`, `waters12dfa`
* Criptografia padrão auxiliar: **AES** (simétrica) e **RSA** (assimétrica), quando aplicável

> Verifique na Crypto API quais esquemas estão habilitados na configuração atual.

### Endpoints (principais)

**Saúde**

```
GET /health
```

**Encriptação**

```
POST /encrypt
Content-Type: application/json

{
  "data": "texto sensível",
  "policy": "(role:doctor AND department:cardiology)",
  "scheme": "fabeo22cp"
}
```

**Decriptação**

```
POST /decrypt
Content-Type: application/json

{
  "ciphertext": "<dados_encriptados>",
  "key": "<chave_do_usuário>",
  "scheme": "fabeo22cp"
}
```

**Geração de Chave**

```
POST /keygen
Content-Type: application/json

{
  "attributes": ["role:doctor", "department:cardiology"],
  "scheme": "fabeo22cp"
}
```

**Exemplos com cURL**

Encriptar:

```bash
curl -X POST http://localhost:8001/encrypt \
  -H "Content-Type: application/json" \
  -d '{
    "data": "Paciente com diabetes",
    "policy": "(doctor AND endocrinology) OR emergency",
    "scheme": "fabeo22cp"
  }'
```

Gerar chave:

```bash
curl -X POST http://localhost:8001/keygen \
  -H "Content-Type: application/json" \
  -d '{
    "attributes": ["doctor", "endocrinology"],
    "scheme": "fabeo22cp"
  }'
```

Decriptar:

```bash
curl -X POST http://localhost:8001/decrypt \
  -H "Content-Type: application/json" \
  -d '{
    "ciphertext": "<encrypted_data>",
    "key": "<generated_key>",
    "scheme": "fabeo22cp"
  }'
```

---

## 8. Estrutura do Projeto (branch `test-fabeo-isolated`)

```
MACHS/
├── services/
│   ├── fabeo-service/              # Microserviço FABEO (Python 2.7)
│   │   ├── main.py                 # Flask HTTP server
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── crypto-api/                 # API Gateway (Python 3.8+ FastAPI)
│       ├── main.py                 # FastAPI application (porta 8001)
│       ├── fabeo_client.py         # Cliente para o FABEO Service
│       ├── models.py               # Modelos Pydantic
│       ├── standard_crypto.py      # AES/RSA quando aplicável
│       ├── Dockerfile
│       └── requirements.txt
├── submodules/
│   └── FABEO/                      # Submódulo Git com implementação FABEO22
├── docker/
│   ├── docker-compose.yml
│   ├── start-hospital-system.bat
│   ├── stop-hospital-system.bat
│   └── README_DOCKER.md
├── storage/                        # Armazenamento baseado em arquivos (vazio)
│   ├── patients/.gitkeep
│   ├── encounters/.gitkeep
│   └── conditions/.gitkeep
├── docs/
│   ├── SYSTEM_ARCHITECTURE_DOCUMENTATION.md
│   ├── api-reference.md
│   └── ...
├── test_fabeo_isolated.py          # Teste isolado do FABEO
├── test_fabeo_direct.py            # Teste direto da lib FABEO
├── test_fabeo_proper_workflow.py   # Fluxo completo de teste
├── verify_fabeo_setup.py           # Verificação de setup/local
├── .gitignore
├── .gitmodules
├── LICENSE
└── README.md
```

---

## 9. Testes

Executar testes automatizados (ambiente Python local; em Docker utilize os contêineres conforme sua configuração):

```bash
python test_fabeo_isolated.py
python test_fabeo_direct.py
python verify_fabeo_setup.py
```

---

## 10. Resolução de Problemas (Troubleshooting)

**Serviços não iniciam**

```bash
docker-compose ps
docker-compose logs
docker-compose down
docker-compose up --build -d
```

**Problemas no FABEO Service**

```bash
docker-compose logs fabeo-service
# Possíveis causas:
# - Falha na inicialização do Charm-crypto
# - Submódulo FABEO ausente/não inicializado
# - Questões de compatibilidade com Python 2.7
```

**Submódulo ausente**

```bash
git submodule update --init --recursive
# ou, no clone:
# git clone --recursive https://github.com/tomoutsuki/MACHS.git
```

---

## 11. Documentação

Documentação adicional disponível em `docs/`:

* `docs/SYSTEM_ARCHITECTURE_DOCUMENTATION.md` – Documentação técnica da arquitetura
* `docs/api-reference.md` – Especificação dos endpoints da API
* `docker/README_DOCKER.md` – Guia de implantação com Docker

---

## 12. Informações de Branches

**Branch atual:** `test-fabeo-isolated`

* Finalidade: testes de criptografia FABEO isolados
* Componentes: apenas FABEO Service + Crypto API

**Outros branches:**

* `main` – sistema hospitalar completo com frontend
* `base-structure` – backend EHR e banco de dados (estrutura base)

Troca de branch:

```bash
git checkout main          # sistema completo
git checkout base-structure
```

---

## 13. Licença

MIT License – consulte o arquivo [LICENSE](LICENSE).

---

## 14. Referências

* Artigo FABEO: Riepel & Wee, “FABEO: Fast Attribute-based Encryption with Optimal Security”, ACM CCS 2022
* Repositório FABEO: [https://github.com/abecryptools/FABEO](https://github.com/abecryptools/FABEO)
* Charm-crypto: [https://github.com/JHUISI/charm](https://github.com/JHUISI/charm)

---

## 15. Suporte

1. Consulte a documentação em `docs/`
2. Revise a seção de resolução de problemas
3. Verifique os logs do Docker com `docker-compose logs`

---

**Nota:** Este branch é destinado a testes isolados de ABE com FABEO. Para o sistema hospitalar completo (frontend e banco de dados), utilize `main` ou `base-structure`.
