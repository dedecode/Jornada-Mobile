FROM python:3.12.8-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Dependências do sistema
RUN apt-get update && apt-get install -y netcat-openbsd gcc libpq-dev libffi-dev libssl-dev

# Diretório de trabalho
WORKDIR /app

# Instala e configura dependências do projeto
COPY requirements.txt .
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

# Copia os arquivos do projeto
COPY . .

# Comando para rodar com gunicorn (servidor WSGI) com timeout de 120s para IA
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--timeout", "120", "setup.wsgi:application"]
