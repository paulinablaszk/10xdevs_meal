# Dokument wymagań produktu (PRD) - MealPlanner MVP

## 1. Przegląd produktu
MealPlanner to aplikacja webowa pomagająca osobom dbającym o zdrowie oraz będącym na redukcji w szybkim obliczaniu wartości odżywczych własnych przepisów kulinarnych. Użytkownik po rejestracji dodaje przepis w ustandaryzowanej strukturze (lista składników z ilościami oraz kroki przygotowania). Silnik AI analizuje składniki, rozpoznaje jednostki (g, ml, szklanki, łyżki, łyżeczki) i zwraca kaloryczność oraz makroskładniki (białko, tłuszcze, węglowodany). Dane są zapisywane w profilu użytkownika; przepisy są domyślnie prywatne. MVP koncentruje się na prostocie interfejsu, minimalnym zestawie funkcji i wysokiej dokładności obliczeń.

## 2. Problem użytkownika
Dostępne w sieci przepisy rzadko zawierają wiarygodne informacje o kaloryczności i rozkładzie makroskładników. Ręczne wyliczanie tych wartości wymaga czasochłonnych obliczeń i wiedzy dietetycznej. Osoby na redukcji lub dbające o zdrowie potrzebują narzędzia, które automatycznie i wiarygodnie policzy kcal oraz makro, uwzględniając ich indywidualne preferencje (alergeny, limity kaloryczne, cele makro).

## 3. Wymagania funkcjonalne
1. Rejestracja i logowanie użytkownika (unikalny login w postaci e-mail i hasło).
2. Strona profilu z możliwością ustawienia preferencji żywieniowych: alergeny, dzienny limit kcal, cele makro, śledzone mikroelementy.
3. Dodawanie nowego przepisu w zdefiniowanym formacie (składniki + ilości + kroki przygotowania).
4. Automatyczne wyliczanie kcal i makroskładników przez moduł AI.
5. Ręczna korekta danych żywieniowych, gdy AI przekroczy próg dokładności lub na życzenie użytkownika.
6. Lista przepisów prywatnych przypisanych do zalogowanego użytkownika.
7. Widok szczegółów przepisu wraz z wartościami odżywczymi.
8. Edycja i usuwanie własnych przepisów.
9. Walidacja pól przepisu w interfejsie (wymagane pola, ostrzeżenia przy brakujących jednostkach).
10. Obsługa scenariuszy błędów AI (brak składników, nietypowe nazwy, brak jednostek) poprzez komunikaty i sugestie korekty.
11. Oddzielna warstwa logiki AI umożliwiająca przyszłą wymianę modelu lub bazy danych wartości odżywczych.

## 4. Granice produktu (Out of Scope)
1. Import przepisów z adresów URL.
2. Dodawanie multimediów (zdjęcia, wideo) do przepisów.
3. Udostępnianie przepisów innym użytkownikom oraz funkcje społecznościowe.
4. Zaawansowane metryki biznesowe (MAU, retencja) i analityka produktowa.
5. Integracje zewnętrzne (płatności, RODO, marketing) poza podstawowymi wymaganiami prawnymi.
6. Wydajnościowe i produkcyjne tematy (autoskalowanie, CDN) – przeniesione na późniejsze etapy.

## 5. Historyjki użytkowników
| ID | Tytuł | Opis | Kryteria akceptacji |
|----|-------|------|----------------------|
| US-001 | Rejestracja konta | Jako użytkownik chcę zalogować się za pomocą e-maila i hasła, aby uzyskać dostęp do funkcji zapisywania własnych przepisów. | -Po poprawnym wypełnieniu formularza i weryfikacji danych konto jest aktywowane.  <br/>- PUżytkownik otrzymuje potwierdzenie pomyślnej rejestracji i zostaje zalogowany.  |
| US-002 | Logowanie | Jako zarejestrowany użytkownik chcę się zalogować, aby uzyskać dostęp do moich przepisów. | - Poprawne dane logują, błędne wyświetlają komunikat. <br/>- Po zalogowaniu użytkownik trafia na listę przepisów. |
| US-003 | Wylogowanie | Jako zalogowany użytkownik chcę się wylogować, aby zabezpieczyć moje dane. | - Kliknięcie „Wyloguj” kończy sesję i przenosi na stronę logowania. |
| US-004 | Dodanie przepisu | Jako użytkownik chcę dodać nowy przepis w określonym formacie, aby poznać jego wartości odżywcze. | - Formularz wymaga listy składników (nazwa, ilość, jednostka) i kroków przygotowania. <br/>- Po zapisaniu AI oblicza kcal i makro. <br/> |
| US-005 | Lista przepisów | Jako użytkownik chcę zobaczyć listę moich przepisów, aby łatwo wybrać ten, który mnie interesuje. | - Lista pokazuje nazwę, kcal i makro. <br/>- Lista dostępna tylko po zalogowaniu. |
| US-006 | Szczegóły przepisu | Jako użytkownik chcę zobaczyć szczegóły przepisu wraz z makroskładnikami| - Widok wyświetla pełną listę składników, kroki, kcal i makro. <br/>- |
| US-007 | Korekta wartości odżywczych | Jako użytkownik chcę ręcznie poprawić wyliczone kcal/makro, gdy wiem, że są błędne, aby mieć dokładne dane. | - Edycja pól kcal, białko, tłuszcze, węglowodany. <br/>- Po zapisaniu system oznacza przepis jako „skorygowany ręcznie”. |
| US-008 | Edycja przepisu | Jako użytkownik chcę edytować istniejący przepis, aby wprowadzić zmiany w składnikach lub krokach. | - Formularz edycji pre-wypełniony aktualnymi danymi. <br/>- Po zapisaniu AI ponownie przelicza wartości odżywcze. |
| US-009 | Usunięcie przepisu | Jako użytkownik chcę usunąć przepis, którego już nie potrzebuję, aby utrzymać porządek. | - Po potwierdzeniu przepis znika z listy. <br/>- Usunięcie jest nieodwracalne. |
| US-010 | Ustawienie preferencji żywieniowych | Jako użytkownik chcę zdefiniować alergeny i dzienny limit kcal, aby otrzymywać spersonalizowane ostrzeżenia. | - Formularz pozwala wybrać alergeny z listy i wpisać limit kcal. <br/>- Dane zapisywane w profilu i używane przy dodawaniu przepisów. |
| US-011 | Walidacja jednostek | Jako użytkownik chcę, aby aplikacja korzytala z predefiniowanej listy jednostek do wyboru  by uniknąć błędów AI. |  <br/>- Brak jednostki blokuje zapis i wyświetla komunikat. |
| US-012 | Obsługa błędów AI | Jako użytkownik chcę otrzymać jasny komunikat, gdy AI nie może policzyć wartości, aby wiedzieć, co poprawić. | - Jeśli AI zgłasza błąd (brak składnika, nietypowa nazwa, brak jednostki), system pokazuje przyczynę i wskazówki. |
| US-013 | Prywatność danych | Jako użytkownik chcę mieć pewność, że moje przepisy są widoczne tylko dla mnie, aby zachować prywatność. | - Nie zalogowany użytkownik nie może zobaczyć cudzych przepisów. <br/>- Próba dostępu przez innego użytkownika zwraca 403/404. |
| US-014 | Bezpieczny dostęp | Jako użytkownik chcę mieć możliwość rejestracji i logowania się do systemu w sposób zapewniający bezpieczeństwo moich danych. | - Logowanie i rejestracja odbywają się na dedykowanych stronach. <br/>- Logowanie wymaga podania adresu email i hasła. <br/>- Rejestracja wymaga podania adresu email, hasła i potwierdzenia hasła. <br/>- Użytkownik NIE MOŻE korzystać z funkcji aplikacji bez logowania się do systemu <br/>- Użytkownik może logować się do systemu poprzez przycisk w prawym górnym rogu. <br/>- Użytkownik może się wylogować z systemu poprzez przycisk w prawym górnym rogu w głównym <br/>- Nie korzystamy z zewnętrznych serwisów logowania (np. Google, GitHub). <br/>- Odzyskiwanie hasła powinno być możliwe. |


## 6. Metryki sukcesu
1. Dokładność AI: średni błąd obliczeń kcal i makro ≤10 % na zestawie testowym 10 przepisów.
