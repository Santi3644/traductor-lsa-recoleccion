import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout
from tensorflow.keras.callbacks import ModelCheckpoint
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical

# 1. Cargar los datos procesados
print("Cargando tensores de datos...")
try:
    X = np.load('X_entrenamiento.npy')
    y = np.load('y_etiquetas.npy')
except FileNotFoundError:
    print("Error: No se encontraron los archivos .npy. Asegúrate de correr primero el script de procesamiento.")
    exit()

# 2. Preparar los datos
# Convertir las etiquetas a formato "One-Hot" (ej. 2 -> [0, 0, 1, 0, 0])
NUM_CLASES = len(np.unique(y))
y_categorico = to_categorical(y, num_classes=NUM_CLASES)

# Separar en datos de entrenamiento (80%) y prueba (20%)
X_entrenamiento, X_prueba, y_entrenamiento, y_prueba = train_test_split(X, y_categorico, test_size=0.2, random_state=42)

# 3. Diseñar la Arquitectura de la Red Neuronal LSTM
print(f"Diseñando modelo para {NUM_CLASES} clases...")
modelo = Sequential()

# Primera capa LSTM: Recibe los 30 frames y las 126 coordenadas (63 por mano x 2 manos)
modelo.add(LSTM(64, return_sequences=True, activation='relu', input_shape=(30, 126)))

# Segunda capa LSTM: Extrae patrones más complejos
modelo.add(LSTM(128, return_sequences=False, activation='relu'))

# Capas Densas (Clasificación tradicional)
modelo.add(Dense(64, activation='relu'))
modelo.add(Dropout(0.2)) # Apaga el 20% de las neuronas al azar para evitar overfitting

# Capa de Salida: Una neurona por cada seña posible
modelo.add(Dense(NUM_CLASES, activation='softmax'))

# 4. Compilar el modelo
modelo.compile(optimizer='adam', loss='categorical_crossentropy', metrics=['categorical_accuracy'])

# 5. Configurar "Callbacks"
# Guarda automáticamente la mejor versión del modelo durante el entrenamiento
checkpoint = ModelCheckpoint('modelo_lsa_mejor.keras', monitor='val_categorical_accuracy', save_best_only=True, mode='max')

# 6. ¡Entrenar!
print("¡Iniciando entrenamiento!")
historial = modelo.fit(
    X_entrenamiento, 
    y_entrenamiento, 
    epochs=100,           # Cantidad de pasadas completas por los datos
    batch_size=16,        # Cuántos videos procesa a la vez antes de actualizarse
    validation_data=(X_prueba, y_prueba), 
    callbacks=[checkpoint]
)

# 7. Guardar el modelo final (por si acaso)
modelo.save('modelo_lsa_final.keras')
print("\nEntrenamiento finalizado. Modelo guardado como 'modelo_lsa_mejor.keras'")