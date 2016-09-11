package com.receiptshares;

import com.receiptshares.user.UserServiceConfiguration;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.Http401AuthenticationEntryPoint;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;

@Configuration
@EnableWebSecurity
public class SecurityConfiguration extends WebSecurityConfigurerAdapter {

    private final UserServiceConfiguration userServiceConfiguration;

    @Autowired
    public SecurityConfiguration(UserServiceConfiguration userServiceConfiguration) {
        this.userServiceConfiguration = userServiceConfiguration;
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.rememberMe().alwaysRemember(true)
            .and()
            .formLogin().loginProcessingUrl("/v1/open/login").successHandler(authSuccessHandler()).failureHandler(authFailureHandler())
            .and()
            .csrf().csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            .and()
            .antMatcher("/**").authorizeRequests()
            .antMatchers("/v1/open/**").permitAll()
            .antMatchers("/v1/**").authenticated()
            .anyRequest().permitAll()
            .and()
            .exceptionHandling().authenticationEntryPoint(new Http401AuthenticationEntryPoint(""));
    }

    @Override
    protected UserDetailsService userDetailsService() {
        return userServiceConfiguration.userAuthService();
    }

    @Bean
    protected AuthenticationSuccessHandler authSuccessHandler() {
        return (request, response, auth) -> response.setStatus(HttpStatus.OK.value());
    }

    @Bean
    protected AuthenticationFailureHandler authFailureHandler() {
        return (request, response, auth) -> response.setStatus(HttpStatus.UNAUTHORIZED.value());
    }
}
