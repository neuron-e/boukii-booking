import { Injectable } from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {environment} from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SlugGuard implements CanActivate {

  constructor(private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const slug = environment.slug; // Obtén el slug de tu lógica (ej. desde un servicio)

    if (slug) {
      this.router.navigate([`/${slug}`]); // Redirige a la ruta con el slug
      return false; // Bloquea el acceso a la raíz
    }
    return true; // Permite el acceso si no hay slug
  }
}
