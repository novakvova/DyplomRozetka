namespace Rozetka.Api.Common;

public static class ErrorMessages
{
    public const string EmailAlreadyExists = "Користувача із таким email вже існує.";
    public const string InvalidCredentials = "Невірний email або пароль.";
    public const string UserBlocked = "Користувача заблоковано адміністратором.";
    public const string SessionExpired = "Сесія застаріла. Увійдіть ще раз.";
    public const string ProductNotFound = "Товар не знайдено.";
    public const string CategoryNotFound = "Категорію не знайдено.";
    public const string CategoryHasProducts = "Не можна видалити категорію, у якій є товари.";
}