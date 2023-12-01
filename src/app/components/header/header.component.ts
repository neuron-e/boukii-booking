import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from 'src/app/services/data.service';
import { NotificationService } from 'src/app/services/notification.service';
import { PublicService } from 'src/app/services/public.service';
import { SchoolService } from 'src/app/services/school.service';
import { UserService } from 'src/app/services/user.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  slug: string | undefined;

  selectedLang = localStorage.getItem("userLoggedLang");
  selectedUser:any;

  /*User*/
  userLogged: boolean | undefined;
  userFirstName: string | undefined;
  userLastName: string | undefined;
  /*User*/

  /*School*/
  schoolName: string | undefined;
  stationName: string | undefined;
  schoolLogo: string | undefined;
  /*School*/

  @ViewChild('closeModalRegister') closeModalRegister: ElementRef | undefined
  @ViewChild('closeModalLogin') closeModalLogin: ElementRef | undefined

  constructor( public publicService: PublicService , public notificationService: NotificationService, private dataService: DataService , public schoolService: SchoolService , public rutaActiva: ActivatedRoute , public userService: UserService , public router: Router , public translate: TranslateService) {

  }

  countryList: any;
  provinceList: any;
  languageList: any;
  selectedCountry = 365;

  userRegisterForm = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
    password_confirmation: new FormControl(''),
    first_name: new FormControl(''),
    last_name: new FormControl(''),
    birth_date: new FormControl(''),
    phone: new FormControl(''),
    //cp: new FormControl(''),
    country_id: new FormControl(''),
    province_id: new FormControl(''),
    language1_id: new FormControl(''),
    language2_id: new FormControl(''),
    language3_id: new FormControl(''),
  });

  userLoginForm = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });

  userResetPasswordForm = new FormGroup({
    email: new FormControl(''),
    password: new FormControl(''),
  });

  userBookDates:any;

  ngOnInit(): void {

    this.dataService.currentSlug.subscribe(res => this.slug = res);

    /*USER*/
    this.dataService.currentUserLogged.subscribe(res => this.userLogged = res);
    this.dataService.currentUserFirstName.subscribe(res => this.userFirstName = res);
    this.dataService.currentUserLastName.subscribe(res => this.userLastName = res);
    /*USER*/

    /*SCHOOL*/
    this.dataService.currentSchoolName.subscribe(res => this.schoolName = res);
    this.dataService.currentStationName.subscribe(res => this.stationName = res);
    this.dataService.currentSchoolLogo.subscribe(res => this.schoolLogo = res);
    /*SCHOOL*/

    this.getCountryList();
    this.getProvinceList();
    this.getLanguageList();
    this.userRegisterForm.patchValue({
      user_collective: 1,
    });

    this.dataService.currentbookUserDates.subscribe(res => this.userBookDates = res);
    console.log(this.userBookDates);
    console.log(this.userBookDates.length);

  }

  logOut(){
    this.userService.logout()
    .subscribe(
      (response: { response: any; }) => {
        this.dataService.changeUserLogged(false);
        
        this.notificationService.successNotification("Session clôturée avec succès");
      },
      (error: any) => {
        this.notificationService.errorNotification("Une erreur est survenue");
      }
    )
  }

  switchLang(lang: any){
    localStorage.setItem("userLoggedLang",lang);
    this.translate.use(lang);
    this.selectedLang = lang;
  }

  getCountryList(){
    this.publicService.countryList()
      .subscribe(
        (response: { response: any; }) => {
          this.countryList = response.response;
        },
        (error: any) => {

        }
      )
  }

  getProvinceList(){
    this.publicService.provinceList(this.selectedCountry)
      .subscribe(
        (response: { response: any; }) => {
          this.provinceList = response.response;
          this.userRegisterForm.patchValue({
            province_id: response.response[0].id,
          });
        },
        (error: any) => {

        }
      )
  }

  getLanguageList(){
    this.publicService.languageList()
      .subscribe(
        (response: { response: any; }) => {
          this.languageList = response.response;
        },
        (error: any) => {

        }
      )
  }

  register(){
    this.userService.register( this.userRegisterForm )
    .subscribe(
      (response: { response: any; }) => {
        this.dataService.changeUserLogged(true);
        this.dataService.changeUserFirstName(response.response.first_name);
        this.dataService.changeUserLastName(response.response.last_name);
        this.dataService.changeUserToken(response.response.token);

        this.getUsers();

        document.getElementById("close_modalregister_btn")!.click();
        this.notificationService.successNotification("Enregistrement correct");
      },
      (error: any) => {
        if(error.error.messages.email && error.error.messages.email=="validation.required"){
          this.notificationService.errorNotification("Vous devez saisir un email");
          return;
        }
        if(error.error.messages.email && error.error.messages.email=="validation.email"){
          this.notificationService.errorNotification("Vous devez entrer un email correct");
          return;
        }
        if(error.error.messages.email && error.error.messages.email=="validation.unique"){
          this.notificationService.errorNotification("Un compte existe déjà avec cet email");
          return;
        }
        if(error.error.messages.password && error.error.messages.password=="validation.required"){
          this.notificationService.errorNotification("Vous devez entrer votre nouveau mot de passe");
          return;
        }
        if(error.error.messages.password && error.error.messages.password=="validation.min.string"){
          this.notificationService.errorNotification("Le nouveau mot de passe doit comporter au moins 6 caractères");
          return;
        }
        if(error.error.messages.password_confirmation && error.error.messages.password_confirmation=="validation.required"){
          this.notificationService.errorNotification("Vous devez confirmer votre mot de passe");
          return;
        }
        if(error.error.messages.password_confirmation && error.error.messages.password_confirmation=="validation.same"){
          this.notificationService.errorNotification("Les mots de passe ne correspondent pas");
          return;
        }
        if(error.error.messages.first_name && error.error.messages.first_name=="validation.required"){
          this.notificationService.errorNotification("Vous devez entrer un nom");
          return;
        }
        if(error.error.messages.last_name && error.error.messages.last_name=="validation.required"){
          this.notificationService.errorNotification("Vous devez entrer un prenom");
          return;
        }
        if(error.error.messages.birth_date){
          this.notificationService.errorNotification("Vous devez entrer une date de naissance valide");
          return;
        }
        if(error.error.messages.phone && error.error.messages.phone=="validation.required"){
          this.notificationService.errorNotification("Vous devez entrer un téléphone portable");
          return;
        }
        /*
        if(error.error.messages.cp && error.error.messages.cp=="validation.required"){
          this.notificationService.errorNotification("Vous devez entrer un code postal");
          return;
        }
        */
        if(error.error.messages.language1_id){
          this.notificationService.errorNotification("Vous devez sélectionner une langue");
          return;
        }
        if(error.error.messages && error.error.messages=="A client with this email already exists"){
          this.notificationService.errorNotification("Il y a déjà un client avec cet email");
          return;
        }
        this.notificationService.errorNotification("Une erreur est survenue");
      }
    )
  }

  login(){
    this.userService.login( this.userLoginForm.value.email , this.userLoginForm.value.password )
    .subscribe(
      (response: { response: any; }) => {
        this.dataService.changeUserLogged(true);
        this.dataService.changeUserFirstName(response.response.first_name);
        this.dataService.changeUserLastName(response.response.last_name);
        this.dataService.changeUserToken(response.response.token);

        this.getUsers();

        document.getElementById("close_modal_btn")!.click();
        this.notificationService.successNotification("Connexion correcte");
      },
      (error: any) => {
        this.notificationService.errorNotification("Les informations d'identification invalides");
      }
    )
  }

  getUsers(){
    this.userService.usersList()
    .subscribe(
      (response: { response: any; }) => {
        this.dataService.changeUserUsersList(response.response);
        this.dataService.changeSelectedClient(response.response[0].id);
        this.selectedUser = response.response[0].id;
      },
      (error: any) => {
  
      }
    )
  }

  goToCart(){
    if(this.router.url.endsWith('/cart')){
      return false;
    }
    this.router.navigateByUrl('/'+this.slug+"/cart");
    return true;
  }

  goToCourses(){
    this.router.navigateByUrl('/'+this.slug);
  }

  goToUser(){
    this.router.navigateByUrl('/user');
  }

  openResetPassword(){
    document.getElementById("close_modal_btn")!.click();
  }

  petitionRecover() {

    let emailRegexp = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
    if(emailRegexp.test(this.userResetPasswordForm.value.email)==false || this.userResetPasswordForm.value.email==null || this.userResetPasswordForm.value.email=="" || this.userResetPasswordForm.value.email==undefined){
      this.notificationService.errorNotification("Vous devez entrer un email valide");
      return;
    }

    const user = {email: this.userResetPasswordForm.value.email};

    this.userService.userPetitionRecover(user)
      .subscribe(
        (response) => {
          this.notificationService.successNotification("Un email de récupération sera envoyé");
          document.getElementById("close_modal_reset_password_btn")!.click();
        },
        (error) => {
          this.notificationService.errorNotification("Une erreur est survenue");
        }
      )
  }

}
