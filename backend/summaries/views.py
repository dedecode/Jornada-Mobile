from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
import os
import google.generativeai as genai
from .models import DailySummary, WeeklySummary
from .serializers import DailySummarySerializer, WeeklySummarySerializer

class DailySummaryViewSet(viewsets.ModelViewSet):
    serializer_class = DailySummarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return DailySummary.objects.filter(user=self.request.user).order_by('-date')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def current_week(self, request):
        """Retorna resumos da semana atual"""
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)
        
        summaries = self.get_queryset().filter(
            date__range=[start_of_week, end_of_week]
        )
        serializer = self.get_serializer(summaries, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def last_week(self, request):
        """Retorna resumos da semana passada"""
        today = timezone.now().date()
        start_of_last_week = today - timedelta(days=today.weekday() + 7)
        end_of_last_week = start_of_last_week + timedelta(days=6)
        
        summaries = self.get_queryset().filter(
            date__range=[start_of_last_week, end_of_last_week]
        )
        serializer = self.get_serializer(summaries, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def improve_content(self, request):
        """Melhora um texto de anotação com IA usando o Gemini 1.5/3.5 Flash."""
        content = request.data.get('content', '').strip()
        if not content:
            return Response(
                {"error": "O campo 'content' é obrigatório."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return Response(
                {"error": "Chave GEMINI_API_KEY não configurada no arquivo .env do Backend. Adicione-a para testar a IA."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite"))
            
            prompt = (
                "Aja como um tutor acadêmico sênior. Melhore, resuma e estruture de forma extremamente "
                "didática e OBJETIVA o seguinte resumo/anotação de aula feito por um estudante. "
                "Torne o texto conciso e direto ao ponto. "
                "ATENÇÃO: Não utilize formatações em markdown como asteriscos '**' para negrito ou hashtags '#' para títulos. "
                "Retorne apenas o texto limpo, utilizando parágrafos e tópicos simples (hífens ou traços) para listas. Mantenha em português.\n\n"
                f"Anotação do Aluno:\n{content}"
            )
            
            response = model.generate_content(prompt)
            return Response({"improved_content": response.text.strip()})
        except Exception as e:
            return Response(
                {"error": f"Erro de comunicação com o Gemini: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def generate_quiz(self, request):
        """Gera um quiz estruturado JSON com base em um resumo do aluno."""
        content = request.data.get('content', '').strip()
        summary_id = request.data.get('summary_id')

        # Se fornecer id, busca no banco, senão usa o texto direto
        if summary_id:
            try:
                summary = DailySummary.objects.get(id=summary_id, user=request.user)
                content = f"Título: {summary.title}\nConteúdo: {summary.content}"
            except DailySummary.DoesNotExist:
                return Response(
                    {"error": "Resumo não encontrado no banco de dados."}, 
                    status=status.HTTP_404_NOT_FOUND
                )

        if not content:
            return Response(
                {"error": "É necessário fornecer um 'content' (texto) ou 'summary_id' para gerar o quiz."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return Response(
                {"error": "Chave GEMINI_API_KEY não configurada no arquivo .env do Backend. Adicione-a para testar a IA."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite"))

            prompt = (
                "Você é um tutor acadêmico de alta performance. Crie um quiz didático de múltipla escolha para testar o conhecimento do aluno "
                "com base nas anotações de estudo fornecidas abaixo.\n"
                "Retorne um objeto JSON exatamente com a seguinte estrutura:\n"
                "{\n"
                "  \"welcome_message\": \"Uma mensagem curta de boas-vindas ao quiz (máximo 2 frases).\",\n"
                "  \"quiz\": [\n"
                "    {\n"
                "      \"id\": \"1\",\n"
                "      \"question\": \"Enunciado da pergunta baseada no texto.\",\n"
                "      \"options\": [\n"
                "        {\"id\": \"a\", \"text\": \"Texto da opção A\"},\n"
                "        {\"id\": \"b\", \"text\": \"Texto da opção B\"},\n"
                "        {\"id\": \"c\", \"text\": \"Texto da opção C\"},\n"
                "        {\"id\": \"d\", \"text\": \"Texto da opção D\"}\n"
                "      ],\n"
                "      \"correct_option\": \"a\",\n"
                "      \"explanation\": \"Explicação de por que A é a correta.\"\n"
                "    }\n"
                "  ]\n"
                "}\n\n"
                "Regras:\n"
                "1. A mensagem de boas-vindas ('welcome_message') deve conter no máximo duas frases curtas.\n"
                "2. Crie de 2 a 3 perguntas sobre o conteúdo.\n"
                "3. Cada pergunta deve conter exatamente 4 alternativas de resposta (id: 'a', 'b', 'c', 'd').\n"
                "4. Retorne estritamente o JSON válido no formato solicitado, sem textos adicionais antes ou depois.\n\n"
                "Anotações do Aluno:\n"
                f"{content}"
            )

            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json"
                ),
            )
            
            # Imprime a resposta bruta recebida da IA nos logs do Docker para depuração
            print("--- LOG GEMINI RAW RESPONSE ---")
            print(response.text)
            print("--------------------------------")

            import json
            raw_quiz_data = json.loads(response.text)

            # Normalização robusta para garantir conformidade com o contrato esperado pelo mobile
            def normalize_quiz_data(raw_data):
                if not isinstance(raw_data, dict):
                    if isinstance(raw_data, list):
                        raw_data = {"quiz": raw_data}
                    else:
                        raise ValueError("O formato retornado pela IA não é um objeto JSON válido.")

                # Identificar a lista de perguntas em chaves possíveis
                quiz_list = None
                possible_keys = ["quiz", "questions", "perguntas", "quiz_questions", "itens", "items"]
                for key in possible_keys:
                    if key in raw_data and isinstance(raw_data[key], list):
                        quiz_list = raw_data[key]
                        break
                
                if quiz_list is None:
                    for val in raw_data.values():
                        if isinstance(val, list) and len(val) > 0 and isinstance(val[0], dict):
                            quiz_list = val
                            break

                if not quiz_list:
                    raise ValueError("Não foi encontrada uma lista de perguntas no JSON retornado.")

                normalized_quiz = []
                for idx, item in enumerate(quiz_list):
                    if not isinstance(item, dict):
                        continue
                        
                    question_text = item.get("question") or item.get("pergunta") or item.get("enunciado")
                    if not question_text:
                        continue
                        
                    options = item.get("options") or item.get("opcoes") or item.get("alternativas")
                    if not isinstance(options, list):
                        if isinstance(options, dict):
                            options = [{"id": k, "text": str(v)} for k, v in options.items()]
                        else:
                            continue

                    normalized_options = []
                    option_id_mapping = {}
                    
                    valid_ids = ['a', 'b', 'c', 'd']
                    for o_idx, opt in enumerate(options):
                        if o_idx >= 4:
                            break
                        
                        opt_id = valid_ids[o_idx]
                        opt_text = ""
                        old_id = ""
                        
                        if isinstance(opt, dict):
                            opt_text = opt.get("text") or opt.get("texto") or ""
                            old_id = str(opt.get("id") or "").strip().lower()
                        else:
                            opt_text = str(opt)
                        
                        normalized_options.append({
                            "id": opt_id,
                            "text": opt_text
                        })
                        
                        if old_id:
                            option_id_mapping[old_id] = opt_id
                        option_id_mapping[opt_text.lower().strip()] = opt_id

                    if len(normalized_options) < 2:
                        continue

                    raw_correct = str(item.get("correct_option") or item.get("resposta_correta") or item.get("correct") or "").strip().lower()
                    
                    correct_id = 'a'
                    if raw_correct in option_id_mapping:
                        correct_id = option_id_mapping[raw_correct]
                    elif raw_correct in ['a', 'b', 'c', 'd']:
                        correct_id = raw_correct
                    elif raw_correct.startswith('a') or raw_correct.startswith('b') or raw_correct.startswith('c') or raw_correct.startswith('d'):
                        correct_id = raw_correct[0]
                    else:
                        for opt in normalized_options:
                            if opt["text"].lower().strip() in raw_correct or raw_correct in opt["text"].lower().strip():
                                correct_id = opt["id"]
                                break

                    explanation = item.get("explanation") or item.get("explicacao") or item.get("justificativa") or ""

                    normalized_quiz.append({
                        "id": str(item.get("id") or (idx + 1)),
                        "question": question_text,
                        "options": normalized_options,
                        "correct_option": correct_id,
                        "explanation": explanation
                    })

                if not normalized_quiz:
                    raise ValueError("Nenhuma pergunta válida pôde ser estruturada a partir do retorno da IA.")

                welcome_message = raw_data.get("welcome_message") or raw_data.get("mensagem_boas_vindas") or "Preparei este quiz com base nos seus estudos!"
                
                return {
                    "welcome_message": welcome_message,
                    "quiz": normalized_quiz
                }

            quiz_data = normalize_quiz_data(raw_quiz_data)
            return Response(quiz_data)
        except Exception as e:
            return Response(
                {"error": f"Erro de comunicação com o Gemini: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['post'])
    def transcribe_audio(self, request):
        """Transcreve um arquivo de áudio enviado usando a IA Gemini."""
        audio_file = request.FILES.get('audio')
        if not audio_file:
            return Response(
                {"error": "Nenhum arquivo de áudio enviado."}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return Response(
                {"error": "Chave GEMINI_API_KEY não configurada no arquivo .env do Backend."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite"))
            
            audio_bytes = audio_file.read()
            mime_type = audio_file.content_type
            if not mime_type or mime_type == 'application/octet-stream':
                ext = os.path.splitext(audio_file.name)[1].lower()
                if ext == '.m4a':
                    mime_type = 'audio/m4a'
                elif ext == '.wav':
                    mime_type = 'audio/wav'
                elif ext == '.mp3':
                    mime_type = 'audio/mp3'
                elif ext == '.caf':
                    mime_type = 'audio/x-caf'
                else:
                    mime_type = 'audio/wav'
            
            prompt = (
                "Por favor, transcreva o áudio a seguir na íntegra. "
                "Retorne apenas o texto transcrito em português, sem qualquer preâmbulo, explicação ou comentário adicional."
            )
            
            response = model.generate_content([
                {
                    'mime_type': mime_type,
                    'data': audio_bytes
                },
                prompt
            ])
            
            transcription = response.text.strip()
            return Response({"transcription": transcription})
            
        except Exception as e:
            return Response(
                {"error": f"Erro ao transcrever áudio com Gemini: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def generate_feedback(self, request, pk=None):
        """Gera feedback acadêmico e tópicos sugeridos para o resumo usando a IA Gemini."""
        summary = self.get_object()
        
        content = f"Título: {summary.title}\nConteúdo: {summary.content}"
        
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return Response(
                {"error": "Chave GEMINI_API_KEY não configurada no arquivo .env do Backend."}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
        try:
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel(os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite"))
            
            prompt = (
                "Você é um tutor acadêmico de alta performance. Analise o seguinte resumo de estudos feito por um aluno "
                "e forneça um feedback pedagógico construtivo para ajudá-lo a fixar o conteúdo. Além disso, sugira "
                "uma lista de tópicos/assuntos relacionados que ele deve estudar em seguida para aprofundar seu conhecimento.\n\n"
                "Retorne um objeto JSON exatamente com a seguinte estrutura:\n"
                "{\n"
                "  \"feedback\": \"O seu feedback pedagógico e conselhos de estudo (máximo 4 a 5 frases em português). Seja encorajador e aponte pontos fortes e fracos se houver.\",\n"
                "  \"suggested_topics\": [\"Tópico 1\", \"Tópico 2\", \"Tópico 3\"]\n"
                "}\n\n"
                "Retorne estritamente o JSON válido no formato solicitado, sem textos adicionais antes ou depois.\n\n"
                f"Resumo do Aluno:\n{content}"
            )
            
            response = model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json"
                ),
            )
            
            import json
            data = json.loads(response.text)
            
            feedback_text = data.get("feedback", "").strip()
            suggested_topics_list = data.get("suggested_topics", [])
            
            if not isinstance(suggested_topics_list, list):
                suggested_topics_list = []
                
            summary.ai_feedback = feedback_text
            summary.suggested_topics = suggested_topics_list
            summary.is_processed_by_ai = True
            summary.save()
            
            serializer = self.get_serializer(summary)
            return Response(serializer.data)
            
        except Exception as e:
            return Response(
                {"error": f"Erro de comunicação com o Gemini: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class WeeklySummaryViewSet(viewsets.ModelViewSet):
    serializer_class = WeeklySummarySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WeeklySummary.objects.filter(user=self.request.user).order_by('-week_start')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)