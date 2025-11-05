#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SCRIPT PARA VERIFICAÇÃO E INSTALAÇÃO DE DEPENDÊNCIAS FABEO
Verifica se todos os componentes do sistema FABEO estão corretamente instalados.
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def print_error(message: str):
    print(f"[ERROR] {message}")

def print_status(message: str, ok: bool | None = None):
    """
    Imprime mensagens padronizadas.
      - ok=True  -> [ OK ] Mensagem
      - ok=False -> [FAIL] Mensagem
      - ok=None  -> [INFO] Mensagem
    """
    if ok is True:
        tag = "[ OK ]"
    elif ok is False:
        tag = "[FAIL]"
    else:
        tag = "[INFO]"
    print(f"{tag} {message}")

def check_fabeo_submodule():
    # Verifica se o submódulo FABEO está presente
    print_status("\n\n[PROCESSO 1] Verificando submódulo FABEO...")

    fabeo_path = Path("submodules/FABEO")

    # Verifica se o diretório existe
    if not fabeo_path.exists():
        print_error("Diretório submodules/FABEO não encontrado")
        return False

    print_status(f"Diretório FABEO encontrado: {fabeo_path.absolute()}", True)

    # Verifica a presença dos arquivos principais do FABEO
    key_files = [
        "FABEO/__init__.py",
        "FABEO/fabeo22cp/__init__.py",
        "FABEO/fabeo22kp/__init__.py",
        "README.md",
        "setup.py"
    ]

    all_present = True
    for file in key_files:
        file_path = fabeo_path / file
        exists = file_path.exists()
        print_status(f"  {file}", exists)
        if not exists:
            all_present = False

    return all_present

def check_docker_services():
    # Verifica se os serviços Docker estão em execução
    print_status("\n\n[PROCESSO 2] Verificando serviços Docker...")

    try:
        # Verifica se o Docker está rodando
        result = subprocess.run(
            ["docker", "ps"],
            capture_output=True,
            text=True,
            timeout=10
        )

        if result.returncode != 0:
            print_error("Docker não está em execução")
            return False

        print_status("Docker está em execução", True)

        # Verifica os serviços FABEO ativos
        services = {
            "machs-fabeo-service": False,
            "machs-microservice-api": False
        }

        for line in result.stdout.split('\n'):
            for service in services.keys():
                if service in line:
                    services[service] = True

        for service, running in services.items():
            print_status(f"Serviço {service}: {'Ativo' if running else 'Inativo'}", running)

        return all(services.values())

    except FileNotFoundError:
        print_error("Docker não está instalado")
        return False
    except subprocess.TimeoutExpired:
        print_error("Tempo limite ao verificar Docker")
        return False
    except Exception as e:
        print_error(f"Erro ao verificar Docker: {e}")
        return False

def check_service_health():
    # Verifica o estado (health) dos serviços via API
    print_status("\n\n[PROCESSO 3] Verificando integridade (health) dos serviços...")

    try:
        import requests
    except ImportError:
        print_error("Biblioteca 'requests' não instalada. Instalando...")
        subprocess.run([sys.executable, "-m", "pip", "install", "requests"],
                      capture_output=True)
        import requests

    services = {
        "FABEO Service": "http://localhost:8002/health",
        "Crypto API": "http://localhost:8001/health"
    }

    all_healthy = True
    for service_name, url in services.items():
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print_status(f"{service_name}: {url}", True)
                try:
                    data = response.json()
                    print_status(f"    Resposta: {json.dumps(data, indent=4, ensure_ascii=False)}")
                except Exception:
                    # Silencia caso não seja JSON
                    pass
            else:
                print_error(f"{service_name}: HTTP {response.status_code}")
                all_healthy = False
        except requests.exceptions.ConnectionError:
            print_error(f"{service_name}: Não conectado (serviço possivelmente inativo)")
            all_healthy = False
        except requests.exceptions.Timeout:
            print_error(f"{service_name}: Tempo limite de resposta")
            all_healthy = False
        except Exception as e:
            print_error(f"{service_name}: Erro - {e}")
            all_healthy = False

    return all_healthy

def check_docker_files():
    """Verifica se os arquivos necessários do Docker existem"""
    print_status("\n\n[PROCESSO 4] Verificando arquivos de configuração do Docker...")

    required_files = {
        "docker/docker-compose.yml": "Configuração do Docker Compose",
        "docker/start-hospital-system.bat": "Script de inicialização",
        "docker/stop-hospital-system.bat": "Script de parada",
        "services/fabeo-service/Dockerfile": "Dockerfile do FABEO Service",
        "services/fabeo-service/main.py": "Código principal do FABEO Service",
        "services/crypto-api/Dockerfile": "Dockerfile do Crypto API",
        "services/crypto-api/main.py": "Código principal do Crypto API",
        "services/crypto-api/fabeo_client.py": "Cliente FABEO",
    }

    all_present = True
    for file_path, description in required_files.items():
        path = Path(file_path)
        exists = path.exists()
        print_status(f"  {description}: {file_path}", exists)
        if not exists:
            all_present = False

    return all_present

def check_storage_structure():
    """Verifica a estrutura de armazenamento (storage)"""
    print_status("\n\n[PROCESSO 5] Verificando estrutura de armazenamento...")

    storage_dirs = [
        "storage/patients",
        "storage/encounters",
        "storage/conditions"
    ]

    all_present = True
    for dir_path in storage_dirs:
        path = Path(dir_path)
        exists = path.exists() and path.is_dir()
        print_status(f"  {dir_path}/", exists)
        if not exists:
            all_present = False

    return all_present

def test_encryption_decryption():
    """Testa a funcionalidade de encriptação e decriptação via API"""
    print_status("\n\n[PROCESSO 6] Testando funcionalidade de encriptação/decriptação...")

    try:
        import requests
    except ImportError:
        print_error("Biblioteca 'requests' não disponível")
        return False

    base_url = "http://localhost:8001"

    # Teste de configuração inicial
    try:
        response = requests.post(f"{base_url}/setup", json={}, timeout=10)
        if response.status_code == 200:
            print_status("Setup do sistema ABE", True)
            setup_data = response.json()
        else:
            print_error(f"Setup do sistema ABE: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Setup do sistema ABE: {e}")
        return False

    # Teste de encriptação
    try:
        encrypt_data = {
            "data": "Dados de teste para verificação",
            "policy": "(1 and 2)"
        }
        response = requests.post(f"{base_url}/encrypt", json=encrypt_data, timeout=10)
        if response.status_code == 200:
            print_status("Encriptação ABE", True)
            ciphertext_data = response.json()
            ciphertext = ciphertext_data.get("ciphertext")
        else:
            print_error(f"Encriptação ABE: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Encriptação ABE: {e}")
        return False

    # Teste de geração de chave
    try:
        keygen_data = {
            "attributes": ["1", "2"]
        }
        response = requests.post(f"{base_url}/keygen", json=keygen_data, timeout=10)
        if response.status_code == 200:
            print_status("Geração de chave ABE", True)
            key_data = response.json()
            user_key = key_data.get("key")
            if not user_key:
                print_status(f"    Aviso: Resposta da keygen: {json.dumps(key_data, indent=4, ensure_ascii=False)}")
        else:
            print_error(f"Geração de chave ABE: HTTP {response.status_code}")
            return False
    except Exception as e:
        print_error(f"Geração de chave ABE: {e}")
        return False

    # Teste de decriptação
    try:
        decrypt_data = {
            "ciphertext": ciphertext,
            "key": user_key
        }
        response = requests.post(f"{base_url}/decrypt", json=decrypt_data, timeout=10)
        if response.status_code == 200:
            print_status("Decriptação ABE", True)
            decrypted = response.json()
            if decrypted.get("plaintext") == "Dados de teste para verificação":
                print_status("Verificação dos dados decriptados", True)
                return True
            else:
                print_status("Verificação dos dados decriptados (dados divergentes)", False)
                print_status("    Esperado: 'Dados de teste para verificação'")
                print_status(f"    Recebido: '{decrypted.get('plaintext')}'")
                return False
        else:
            print_error(f"Decriptação ABE: HTTP {response.status_code}")
            try:
                error_detail = response.json()
                print_status(f"    Detalhe do erro: {json.dumps(error_detail, indent=4, ensure_ascii=False)}")
            except Exception:
                print_status(f"    Resposta: {response.text}")
            return False
    except Exception as e:
        print_error(f"Decriptação ABE: {e}")
        return False

def print_summary(results):
    """Imprime um resumo dos resultados"""
    print_status("\n" + "="*70)
    print_status("RESUMO DA VERIFICAÇÃO")
    print_status("="*70)

    total = len(results)
    passed = sum(1 for r in results.values() if r)
    failed = total - passed

    for test_name, success in results.items():
        msg = f"{'✅ PASSOU' if success else '❌ FALHOU'}: {test_name}"
        print_status(msg, success)

    print_status("\n" + "-"*70)
    print_status(f"Total de testes: {total}")
    print_status(f"Passaram: {passed}")
    print_status(f"Falharam: {failed}")
    print_status(f"Taxa de sucesso: {(passed/total)*100:.1f}%")
    print_status("="*70)

    if failed == 0:
        print_status("\n🎉 TODOS OS TESTES FORAM BEM-SUCEDIDOS!")
        print_status("✅ Sistema FABEO está totalmente funcional e pronto para uso!", True)
    else:
        print_error("\n⚠️  ALGUNS TESTES FALHARAM")
        print_status("Verifique os erros acima e corrija os problemas.")
        if not results.get("Serviços Docker"):
            print_status("\n💡 Dica: Inicie os serviços com: cd docker && docker-compose up -d")

    return failed == 0

def test_fabeo_integration():
    """Função principal de verificação"""
    print_status("="*70)
    print_status("TESTE ISOLADO FABEO - SCRIPT DE VERIFICAÇÃO")
    print_status("="*70)
    print_status("Iniciando verificação de todos os componentes do sistema FABEO...\n")

    results = {}

    # Executa todas as verificações
    results["Submódulo FABEO"] = check_fabeo_submodule()
    results["Arquivos Docker"] = check_docker_files()
    results["Estrutura de Armazenamento"] = check_storage_structure()
    results["Serviços Docker"] = check_docker_services()

    if results["Serviços Docker"]:
        results["Integridade dos Serviços"] = check_service_health()
        results["Encriptação/Decriptação"] = test_encryption_decryption()
    else:
        print_error("\n⚠️  Serviços Docker não estão em execução. Pulando testes de API.")
        results["Integridade dos Serviços"] = False
        results["Encriptação/Decriptação"] = False

    # Imprime o resumo
    success = print_summary(results)

    # Informações adicionais
    print_status("\n" + "="*70)
    print_status("INFORMAÇÕES ADICIONAIS")
    print_status("="*70)
    print_status("\n📋 Arquitetura do Sistema:")
    print_status("  - FABEO Service: Python 2.7 + Charm-crypto 0.43 (Porta 8002)")
    print_status("  - Crypto API: Python 3.8+ + FastAPI (Porta 8001)")
    print_status("  - Rede Docker: machs-network (bridge)")
    print_status("  - Armazenamento: Baseado em arquivos (patients/, encounters/, conditions/)")

    print_status("\n🔧 Comandos úteis:")
    print_status("  - Iniciar: cd docker && docker-compose up -d")
    print_status("  - Parar: cd docker && docker-compose down")
    print_status("  - Logs: cd docker && docker-compose logs -f")
    print_status("  - Status: cd docker && docker-compose ps")

    print_status("\n🧪 Scripts de teste:")
    print_status("  - python test_fabeo_isolated.py")
    print_status("  - python test_fabeo_proper_workflow.py")
    print_status("  - python verify_fabeo_setup.py")

    print_status("\n🌐 Endpoints da API:")
    print_status("  - Health: http://localhost:8001/health")
    print_status("  - Documentação: http://localhost:8001/docs")
    print_status("  - Encrypt: POST http://localhost:8001/encrypt")
    print_status("  - Decrypt: POST http://localhost:8001/decrypt")
    print_status("  - Key Gen: POST http://localhost:8001/keygen")
    print_status("  - Setup: POST http://localhost:8001/setup")

    return 0 if success else 1

if __name__ == "__main__":
    exit_code = test_fabeo_integration()
    sys.exit(exit_code)
