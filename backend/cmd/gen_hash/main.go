package main

import (
	"fmt"

	"golang.org/x/crypto/bcrypt"
)

func main() {
	password := "123456"
	hash, err := bcrypt.GenerateFromPassword([]byte(password), 14) // ❗ Cost 14 как в коде!
	if err != nil {
		panic(err)
	}
	fmt.Println("HASH FOR '123456' (cost=14):")
	fmt.Println(string(hash))
}
