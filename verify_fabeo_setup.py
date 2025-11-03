#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SCRIPT PARA VERIFICAÇÃO E INSTALAÇÃO DE DEPENDÊNCIAS FABEO
Verifica se todos os componentes do sistema FABEO estão corretamente instalados
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def print_status(message, success):
    """Print status with colored output"""
    status = "✅" if success else "❌"
    print(f"{status} {message}")
    return success

def check_fabeo_submodule():
    """Verifica se o submódulo FABEO está presente"""
    print("\n1. Verificando submódulo FABEO...")
    
    fabeo_path = Path("submodules/FABEO")
    
    # Check if directory exists
    if not fabeo_path.exists():
        print_status("Diretório submodules/FABEO não encontrado", False)
        return False
    
    print_status(f"Diretório FABEO encontrado: {fabeo_path.absolute()}", True)
    
    # Check for key FABEO files
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
        if file_path.exists():
            print_status(f"  {file}", True)
        else:
            print_status(f"  {file}", False)
            all_present = False
    
    return all_present

def check_docker_services():
    """Verifica se os serviços Docker estão rodando"""
    print("\n2. Verificando serviços Docker...")
    
    try:
        # Check if Docker is running
        result = subprocess.run(
            ["docker", "ps"], 
            capture_output=True, 
            text=True,
            timeout=10
        )
        
        if result.returncode != 0:
            print_status("Docker não está rodando", False)
            return False
        
        print_status("Docker está rodando", True)
        
        # Check for FABEO services
        services = {
            "machs-fabeo-service": False,
            "machs-crypto-api": False
        }
        
        for line in result.stdout.split('\n'):
            for service in services.keys():
                if service in line:
                    services[service] = True
        
        for service, running in services.items():
            print_status(f"  Serviço {service}", running)
        
        return all(services.values())
        
    except FileNotFoundError:
        print_status("Docker não está instalado", False)
        return False
    except subprocess.TimeoutExpired:
        print_status("Timeout ao verificar Docker", False)
        return False
    except Exception as e:
        print_status(f"Erro ao verificar Docker: {e}", False)
        return False

def check_service_health():
    """Verifica o health dos serviços via API"""
    print("\n3. Verificando health dos serviços...")
    
    try:
        import requests
    except ImportError:
        print_status("Biblioteca 'requests' não instalada. Instalando...", False)
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
                print_status(f"  {service_name}: {url}", True)
                try:
                    data = response.json()
                    print(f"    Response: {json.dumps(data, indent=4)}")
                except:
                    pass
            else:
                print_status(f"  {service_name}: HTTP {response.status_code}", False)
                all_healthy = False
        except requests.exceptions.ConnectionError:
            print_status(f"  {service_name}: Não conectado (serviço não está rodando?)", False)
            all_healthy = False
        except requests.exceptions.Timeout:
            print_status(f"  {service_name}: Timeout", False)
            all_healthy = False
        except Exception as e:
            print_status(f"  {service_name}: Erro - {e}", False)
            all_healthy = False
    
    return all_healthy

def check_docker_files():
    """Verifica se os arquivos Docker necessários existem"""
    print("\n4. Verificando arquivos de configuração Docker...")
    
    required_files = {
        "docker/docker-compose.yml": "Docker Compose configuration",
        "docker/start-hospital-system.bat": "Script de inicialização",
        "docker/stop-hospital-system.bat": "Script de parada",
        "services/fabeo-service/Dockerfile": "Dockerfile do FABEO Service",
        "services/fabeo-service/main.py": "Código principal FABEO Service",
        "services/crypto-api/Dockerfile": "Dockerfile do Crypto API",
        "services/crypto-api/main.py": "Código principal Crypto API",
        "services/crypto-api/fabeo_client.py": "Cliente FABEO",
    }
    
    all_present = True
    for file_path, description in required_files.items():
        path = Path(file_path)
        if path.exists():
            print_status(f"  {description}: {file_path}", True)
        else:
            print_status(f"  {description}: {file_path}", False)
            all_present = False
    
    return all_present

def check_storage_structure():
    """Verifica estrutura de storage"""
    print("\n5. Verificando estrutura de armazenamento...")
    
    storage_dirs = [
        "storage/patients",
        "storage/encounters", 
        "storage/conditions"
    ]
    
    all_present = True
    for dir_path in storage_dirs:
        path = Path(dir_path)
        if path.exists() and path.is_dir():
            print_status(f"  {dir_path}/", True)
        else:
            print_status(f"  {dir_path}/", False)
            all_present = False
    
    return all_present

def test_encryption_decryption():
    """Testa encriptação e decriptação via API"""
    print("\n6. Testando funcionalidade de encriptação/decriptação...")
    
    try:
        import requests
    except ImportError:
        print_status("Biblioteca 'requests' não disponível", False)
        return False
    
    base_url = "http://localhost:8001"
    
    # Test setup
    try:
        response = requests.post(f"{base_url}/setup", json={}, timeout=10)
        if response.status_code == 200:
            print_status("  Setup do sistema ABE", True)
            setup_data = response.json()
        else:
            print_status(f"  Setup do sistema ABE: HTTP {response.status_code}", False)
            return False
    except Exception as e:
        print_status(f"  Setup do sistema ABE: {e}", False)
        return False
    
    # Test encryption
    try:
        encrypt_data = {
            "data": "Test data for verification",
            "policy": "(1 and 2)"
        }
        response = requests.post(f"{base_url}/encrypt", json=encrypt_data, timeout=10)
        if response.status_code == 200:
            print_status("  Encriptação ABE", True)
            ciphertext_data = response.json()
            ciphertext = ciphertext_data.get("ciphertext")
        else:
            print_status(f"  Encriptação ABE: HTTP {response.status_code}", False)
            return False
    except Exception as e:
        print_status(f"  Encriptação ABE: {e}", False)
        return False
    
    # Test key generation
    try:
        keygen_data = {
            "attributes": ["1", "2"]
        }
        response = requests.post(f"{base_url}/keygen", json=keygen_data, timeout=10)
        if response.status_code == 200:
            print_status("  Geração de chave ABE", True)
            key_data = response.json()
            user_key = key_data.get("key")
            if not user_key:
                print(f"    Aviso: Resposta da keygen: {json.dumps(key_data, indent=4)}")
        else:
            print_status(f"  Geração de chave ABE: HTTP {response.status_code}", False)
            return False
    except Exception as e:
        print_status(f"  Geração de chave ABE: {e}", False)
        return False
    
    # Test decryption
    try:
        decrypt_data = {
            "ciphertext": ciphertext,
            "key": user_key  # Changed from 'user_key' to 'key'
        }
        response = requests.post(f"{base_url}/decrypt", json=decrypt_data, timeout=10)
        if response.status_code == 200:
            print_status("  Decriptação ABE", True)
            decrypted = response.json()
            if decrypted.get("plaintext") == "Test data for verification":
                print_status("  Verificação de dados decriptados", True)
                return True
            else:
                print_status("  Verificação de dados decriptados (dados não correspondem)", False)
                print(f"    Esperado: 'Test data for verification'")
                print(f"    Recebido: '{decrypted.get('plaintext')}'")
                return False
        else:
            print_status(f"  Decriptação ABE: HTTP {response.status_code}", False)
            try:
                error_detail = response.json()
                print(f"    Detalhe do erro: {json.dumps(error_detail, indent=4)}")
            except:
                print(f"    Resposta: {response.text}")
            return False
    except Exception as e:
        print_status(f"  Decriptação ABE: {e}", False)
        return False

def print_summary(results):
    """Imprime resumo dos resultados"""
    print("\n" + "="*70)
    print("RESUMO DA VERIFICAÇÃO")
    print("="*70)
    
    total = len(results)
    passed = sum(1 for r in results.values() if r)
    failed = total - passed
    
    for test_name, success in results.items():
        status = "✅ PASSOU" if success else "❌ FALHOU"
        print(f"{status}: {test_name}")
    
    print("\n" + "-"*70)
    print(f"Total de testes: {total}")
    print(f"Passou: {passed}")
    print(f"Falhou: {failed}")
    print(f"Taxa de sucesso: {(passed/total)*100:.1f}%")
    print("="*70)
    
    if failed == 0:
        print("\n🎉 TODOS OS TESTES PASSARAM!")
        print("✅ Sistema FABEO está totalmente funcional e pronto para uso!")
    else:
        print("\n⚠️  ALGUNS TESTES FALHARAM")
        print("Por favor, verifique os erros acima e corrija os problemas.")
        
        if not results.get("Serviços Docker"):
            print("\n💡 Dica: Inicie os serviços com: cd docker && docker-compose up -d")
    
    return failed == 0

def test_fabeo_integration():
    """Função principal de verificação"""
    print("="*70)
    print("FABEO ISOLATED TESTING - SCRIPT DE VERIFICAÇÃO")
    print("="*70)
    print("Verificando todos os componentes do sistema FABEO...\n")
    
    results = {}
    
    # Run all checks
    results["Submódulo FABEO"] = check_fabeo_submodule()
    results["Arquivos Docker"] = check_docker_files()
    results["Estrutura de Storage"] = check_storage_structure()
    results["Serviços Docker"] = check_docker_services()
    
    if results["Serviços Docker"]:
        results["Health dos Serviços"] = check_service_health()
        results["Encriptação/Decriptação"] = test_encryption_decryption()
    else:
        print("\n⚠️  Serviços Docker não estão rodando. Pulando testes de API.")
        results["Health dos Serviços"] = False
        results["Encriptação/Decriptação"] = False
    
    # Print summary
    success = print_summary(results)
    
    # Additional information
    print("\n" + "="*70)
    print("INFORMAÇÕES ADICIONAIS")
    print("="*70)
    print("\n📋 Arquitetura do Sistema:")
    print("  - FABEO Service: Python 2.7 + Charm-crypto 0.43 (Port 8002)")
    print("  - Crypto API: Python 3.8+ + FastAPI (Port 8001)")
    print("  - Rede Docker: machs-network (bridge)")
    print("  - Storage: File-based (patients/, encounters/, conditions/)")
    
    print("\n🔧 Comandos úteis:")
    print("  - Iniciar: cd docker && docker-compose up -d")
    print("  - Parar: cd docker && docker-compose down")
    print("  - Logs: cd docker && docker-compose logs -f")
    print("  - Status: cd docker && docker-compose ps")
    
    print("\n🧪 Scripts de teste:")
    print("  - python test_fabeo_isolated.py")
    print("  - python test_fabeo_proper_workflow.py")
    print("  - python verify_fabeo_setup.py")
    
    print("\n🌐 Endpoints da API:")
    print("  - Health: http://localhost:8001/health")
    print("  - API Docs: http://localhost:8001/docs")
    print("  - Encrypt: POST http://localhost:8001/encrypt")
    print("  - Decrypt: POST http://localhost:8001/decrypt")
    print("  - Key Gen: POST http://localhost:8001/keygen")
    print("  - Setup: POST http://localhost:8001/setup")
    
    return 0 if success else 1

if __name__ == "__main__":
    exit_code = test_fabeo_integration()
    sys.exit(exit_code)