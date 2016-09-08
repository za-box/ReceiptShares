package com.receiptshares.user.dao

import com.receiptshares.user.exceptions.EmailNotUniqueException
import com.receiptshares.user.model.User
import com.receiptshares.user.registration.NewUserDTO
import org.slf4j.Logger
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.dao.DataIntegrityViolationException
import org.springframework.security.core.userdetails.UserDetails
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Component

@Component
class UserDao {

    private static final Logger LOGGER = LoggerFactory.getLogger(UserDao)

    def UserRepo userRepo
    def PasswordEncoder passwordEncoder

    @Autowired
    UserDao(UserRepo repo, PasswordEncoder passwordEncoder) {
        this.userRepo = repo
        this.passwordEncoder = passwordEncoder
    }

    def registerNewUser(NewUserDTO newUser) {
        def user = new UserEntity(name: newUser.name, email: newUser.email)
        user.passwordHash = passwordEncoder.encode(newUser.password)

        try {
            userRepo.save(user)
        } catch (DataIntegrityViolationException div) {
            throw  new EmailNotUniqueException(newUser.email)
        }
    }

    User getByEmail(String email) {
        def found = userRepo.findByEmail(email)
        if (found) {
            return new User(name: found.name, email: found.email, passwordHash: found.passwordHash)
        }
        return null
    }
}
