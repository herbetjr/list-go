import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { databaseConfig } from './database.config';
import { jwtConfig } from './jwt.config';
import { Usuario } from './models/usuario.model';
import { Lista } from './models/lista.model';
import { ItemLista } from './models/item-lista.model';
import { ListaAdministrador } from './models/lista-administrador.model';
import { AuthGuard } from './guards/auth.guard';
import { AuthService } from './services/auth.service';
import { ListaService } from './services/lista.service';
import { UsuarioService } from './services/usuario.service';
import { AuthController } from './controllers/auth.controller';
import { ListaController } from './controllers/lista.controller';
import { UsuarioController } from './controllers/usuario.controller';
import { HealthController } from './controllers/health.controller';

@Module({
  imports: [
    TypeOrmModule.forRoot(databaseConfig),
    TypeOrmModule.forFeature([Usuario, Lista, ItemLista, ListaAdministrador]),
    JwtModule.register({
      global: true,
      secret: jwtConfig.secret,
      signOptions: { expiresIn: jwtConfig.expiresIn },
    }),
  ],
  controllers: [
    HealthController,
    AuthController,
    UsuarioController,
    ListaController,
  ],
  providers: [
    AuthService,
    UsuarioService,
    ListaService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}

