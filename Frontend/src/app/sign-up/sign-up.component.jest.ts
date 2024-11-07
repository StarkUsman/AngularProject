import { render, screen, waitFor } from "@testing-library/angular";
import { SignUpComponent } from "./sign-up.component";
import userEvent from "@testing-library/user-event";
import { rest } from "msw";
import { setupServer } from "msw/node"
import { HttpClientModule } from "@angular/common/http";
import { SharedModule } from "../shared/shared.module";

let requestBody:any;
let counter = 0;
const server= setupServer(
    rest.post('/api/1.0/users', (req, res, ctx)=>{
        requestBody = req.body;
        counter += 1;
        return res(ctx.status(200), ctx.json({}))
    })
);

beforeEach(()=>{counter = 0;})

beforeAll(()=>{
    server.listen();
})
afterAll(()=>{
    server.close();
})

const setup = async()=>{
    await render(SignUpComponent, {
        imports: [HttpClientModule, SharedModule],
    });
}

describe('SignUpComponent', ()=>{
    describe('layout', ()=>{
        it('has Sign up header', async()=>{
            await setup();
            const header = screen.getByRole('heading', {name: 'Sign Up'});
            expect(header).toBeInTheDocument();
        });

        it('has username input', async()=>{
            await setup();
            expect(screen.getByLabelText('Username')).toBeInTheDocument();
        })

        it('has email input', async()=>{
            await setup();
            expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
        })

        it('has password input', async()=>{
            await setup();
            expect(screen.getByLabelText('Password')).toBeInTheDocument();
        })
        
        it('has password type for password input', async()=>{
            await setup();
            const input = screen.getByLabelText('Password')
            expect(input).toHaveAttribute('type', 'password')
        })

        it('has password Repeat input', async()=>{
            await setup();
            expect(screen.getByLabelText('Password Repeat')).toBeInTheDocument();
        })

        it('has password type for password input', async()=>{
            await setup();
            const input = screen.getByLabelText('Password Repeat')
            expect(input).toHaveAttribute('type', 'password')
        })

        it('has Sign up button', async()=>{
            await setup();
            const button = screen.getByRole('button', {name: 'Sign up'});
            expect(button).toBeInTheDocument();
        });
        
        it('disables the button initially', async()=>{
            await setup();
            const button = screen.getByRole('button', {name: 'Sign up'});
            expect(button).toBeDisabled();
        })
    })
    describe('Interactions', ()=>{
        let button:any;


        const setupForm = async()=>{
            await setup();
            const username = screen.getByLabelText('Username');
            const email = screen.getByLabelText('E-mail');
            const password = screen.getByLabelText('Password');
            const passwordRepeat = screen.getByLabelText('Password Repeat');
            await userEvent.type(username, "user1");
            await userEvent.type(email, "faraz@gmail.com");
            await userEvent.type(password, "P4ssword");
            await userEvent.type(passwordRepeat, "P4ssword");
            button = screen.getByRole('button', {name: 'Sign up'});
        }

        it('enables the button when password and password repeat fields have same value', async()=>{
            await setupForm();
            expect(button).toBeEnabled();
        })

        it('sends username, email, and passwords after clicking the signup button', async()=>{
            await setupForm();
            await userEvent.click(button);
            waitFor(()=>{  
                expect(requestBody).toEqual({
                    username: "user1",
                    password: "P4ssword",
                    email: "faraz@gmail.com"
                })
            })
        })

        it('disables the button when there is an ongoing api call', async()=>{
            await setupForm();
            await userEvent.click(button);
            await userEvent.click(button);
            await waitFor(()=>{
                expect(counter).toBe(1);
            })
            // expect(button).toBeDisabled();
        })

        it('displays spinner after clicking submit', async()=>{
            await setupForm();
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
            await userEvent.click(button);
            expect(screen.queryByRole('status')).toBeInTheDocument();
        })

        it('displays account activation notification after successful request', async()=>{
            await setupForm();
            expect(screen.queryByText('Please check your email to activate your account')).not.toBeInTheDocument();
            await userEvent.click(button);
            const text = await screen.findByText('Please check your email to activate your account');
            expect(text).toBeInTheDocument();
          })
      
          it('hides sign up form after successful request', async()=>{
            await setupForm();
            const form = screen.queryByTestId('form-sign-up');
            await userEvent.click(button);
            const text = await screen.findByText('Please check your email to activate your account');
            expect(form).not.toBeInTheDocument();
            // expect(text).toBeInTheDocument();
          })

    })

})

