# Mini 2 - Image Scrambling

Projekt edukacyjny dotyczacy transformacji cyfrowego obrazu.

## Cel projektu

Celem projektu jest stworzenie aplikacji, ktora pokazuje dzialanie kilku etapow scramblingu i unscramblingu obrazu.  
Projekt nie jest traktowany jako bezpieczny system szyfrowania, lecz jako eksperyment dydaktyczny.

## Zaimplementowane etapy

### Etap 1 - Naiwny scrambling
- przesuniecia wierszy i kolumn,
- pelna odwracalnosc przy poprawnym kluczu,
- wyrazne ograniczenia bezpieczenstwa.

### Etap 2 - Czysta permutacja
- permutacja pikseli sterowana seedem,
- osobna permutacja odwrotna,
- poprawne odtwarzanie obrazu przy wlasciwym kluczu.

### Etap 3 - Wersja wzmocniona
- permutacja pikseli,
- dodatkowa odwracalna substytucja wartosci RGB,
- poprawne odtwarzanie obrazu przy wlasciwym kluczu.

## Funkcje aplikacji

- wczytywanie obrazu PNG / JPEG / BMP,
- wybor etapu 1 / 2 / 3,
- uzycie poprawnego i blednego klucza,
- przyciski Scramble i Unscramble,
- osobny test unscramblingu z blednym kluczem,
- wyswietlanie:
  - obrazu oryginalnego,
  - obrazu scrambled,
  - obrazu restored,
  - difference image,
- zapis wynikow do plikow PNG,
- podstawowe metryki analityczne.

## Metryki

Aplikacja oblicza:
- korelacje pozioma pikseli dla obrazu oryginalnego,
- korelacje pozioma pikseli dla obrazu scrambled,
- MSE dla porownania restored vs original,
- informacje, czy restored jest dokladnie rowny original.

## Technologie

- HTML
- CSS
- JavaScript
- Canvas API

## Uruchomienie projektu

1. Otworzyc folder projektu w Visual Studio Code.
2. Uruchomic plik index.html przez Live Server.
3. Wczytac obraz.
4. Wybrac etap i klucz.
5. Uzyc przyciskow Scramble, Unscramble lub Unscramble (bledny klucz).

## Uwagi

Projekt ma charakter edukacyjny.  
Celem bylo pokazanie roznicy miedzy prostym scramblingiem, czysta permutacja oraz wersja wzmocniona, a takze analiza ograniczen takiego rozwiazania.
