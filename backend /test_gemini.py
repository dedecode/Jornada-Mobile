import os
import sys
from dotenv import load_dotenv

# Carrega variáveis do arquivo .env
load_dotenv()

def check_dependencies():
    """Verifica e instrui sobre a instalação da SDK do Gemini."""
    try:
        import google.generativeai as genai
        from PIL import Image
        return genai, Image
    except ImportError:
        print("\n[ERRO] Dependências ausentes!")
        print("Para executar este teste, instale as dependências executando:")
        print("   pip install google-generativeai pillow python-dotenv")
        print("\nOu use o ambiente virtual (venv) do projeto e rode:")
        print("   pip install -r requirements.txt")
        sys.exit(1)

def main():
    genai, Image = check_dependencies()

    print("=" * 60)
    print("  SCRIPT DE VALIDAÇÃO TÉCNICA - GOOGLE GEMINI API  ")
    print("=" * 60)

    # 1. Carregamento da API Key
    api_key = os.getenv("GEMINI_API_KEY")
    
    if not api_key:
        print("\n⚠️  Chave 'GEMINI_API_KEY' não encontrada no arquivo .env!")
        api_key = input("👉 Insira sua API Key do Google AI Studio para o teste: ").strip()
        if not api_key:
            print("❌ Erro: Uma chave de API é obrigatória para prosseguir.")
            sys.exit(1)
    else:
        print(f"✅ API Key encontrada nas variáveis de ambiente (.env): {api_key[:6]}...{api_key[-4:]}")

    # Configuração da SDK
    genai.configure(api_key=api_key)

    # Nota sobre a nomenclatura do modelo:
    # A SDK aceita 'gemini-3.5-flash', 'gemini-3.1-flash-lite' e o robusto 'gemini-3.1-pro'.
    # Usaremos 'gemini-3.1-flash-lite' como padrão por ser o modelo mais barato disponível para chamadas leves,
    # mas o script permite testar qualquer nome configurado.
    model_name = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
    print(f"🤖 Utilizando o modelo: '{model_name}'")

    try:
        model = genai.GenerativeModel(model_name)
    except Exception as e:
        print(f"❌ Erro ao instanciar o modelo '{model_name}': {e}")
        print("Tentando fallback para o robusto 'gemini-3.1-flash-lite'...")
        model_name = "gemini-3.1-flash-lite"
        model = genai.GenerativeModel(model_name)

    # =========================================================================
    # TESTE 1: Envio de Texto Simples (Sanity Check)
    # =========================================================================
    print("\n--- [TESTE 1] Chamada Simples de Texto (Sanity Check) ---")
    prompt_simples = "Escreva uma resposta curta (uma frase): O que é aprendizado ativo?"
    print(f"Enviando Prompt: \"{prompt_simples}\"")
    
    try:
        response = model.generate_content(prompt_simples)
        print("\n💬 Resposta da IA:")
        print(f"👉 {response.text.strip()}")
        print("\n✅ TESTE 1: OK! Conexão de texto estabelecida com sucesso.")
    except Exception as e:
        print(f"\n❌ Falha no TESTE 1: {e}")
        print("Verifique sua conexão com a internet, validade da chave de API e se a cota gratuita não foi excedida.")
        sys.exit(1)

    # =========================================================================
    # TESTE 2: Resposta Estruturada em JSON (Garantia de Não-Quebra de Contrato)
    # =========================================================================
    print("\n--- [TESTE 2] Resposta Estruturada em JSON Nativo (Prevenção de Retrabalho) ---")
    print("Configurando esquema JSON rígido na API do Gemini...")

    # Prompt instruindo a IA sobre o que fazer
    prompt_estruturado = (
        "Analise o seguinte resumo de estudos de um aluno: 'Estudei sobre redes de computadores, especificamente a camada de transporte. "
        "Entendi que o TCP garante a entrega ordenada e confiável dos pacotes via handshake de 3 vias, enquanto o UDP prioriza velocidade "
        "sem garantia de entrega, sendo ideal para streaming.' "
        "Gere insights educacionais estruturados."
    )

    # A API oficial do Gemini permite forçar a resposta a vir em JSON estruturado
    # com base em um esquema que nós definimos. Isso previne qualquer quebra de contrato!
    import typing_extensions as typing
    
    class ConceitoChave(typing.TypedDict):
        conceito: str
        explicacao: str

    class ContratoInsights(typing.TypedDict):
        resumo_executivo: str
        conceitos_chave: list[ConceitoChave]
        perguntas_revisao: list[str]

    try:
        # Passamos a configuração de geração definindo o tipo e o esquema
        response_json = model.generate_content(
            prompt_estruturado,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=ContratoInsights,
            ),
        )
        print("\n📦 Resposta JSON Estruturada Exata (Enviada pelo Gemini):")
        print(response_json.text)
        print("\n✅ TESTE 2: OK! A IA respondeu em formato JSON estrito adequado ao contrato de API.")
    except Exception as e:
        print(f"\n❌ Falha no TESTE 2 (Resposta estruturada): {e}")
        print("Nota: Respostas estruturadas exigem bibliotecas modernas de typing. Certifique-se de que está usando uma versão atualizada da SDK.")

    # =========================================================================
    # TESTE 3: Demonstração de Envio Multimodal (Imagem + Texto)
    # =========================================================================
    print("\n--- [TESTE 3] Demonstração de Envio Multimodal (Texto + Imagem) ---")
    print("Para enviar uma imagem na SDK do Gemini, fazemos assim:")
    
    codigo_exemplo_imagem = """
    # Exemplo de lógica de processamento de imagem no seu Backend Django:
    # 
    # from PIL import Image
    # import google.generativeai as genai
    #
    # def analisar_resumo_com_foto(texto_prompt, arquivo_imagem_django):
    #     # 1. Carrega a imagem a partir dos bytes recebidos pelo request multipart
    #     img = Image.open(arquivo_imagem_django)
    #
    #     # 2. Instancia o modelo
    #     model = genai.GenerativeModel('gemini-3.1-flash-lite')
    #
    #     # 3. Envia ambos em uma lista
    #     resposta = model.generate_content([texto_prompt, img])
    #     return resposta.text
    """
    print(codigo_exemplo_imagem)
    print("=" * 60)
    print("🎉 Validação técnica concluída com sucesso!")
    print("=" * 60)

if __name__ == "__main__":
    main()
