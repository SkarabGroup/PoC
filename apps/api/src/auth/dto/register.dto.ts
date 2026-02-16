import { IsString, IsEmail, IsNotEmpty, MinLength, Matches } from 'class-validator';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3, { message: 'Username deve contenere almeno 3 caratteri' })
  username: string;

  @IsEmail({}, { message: 'Email non valida' })
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password deve contenere almeno 8 caratteri' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    {
      message: 'Password deve contenere almeno una lettera maiuscola, una minuscola, un numero e un carattere speciale (@$!%*?&)',
    }
  )
  password: string;
}
